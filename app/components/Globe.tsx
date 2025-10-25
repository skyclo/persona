import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
// import GLSL shaders as raw strings (Vite ?raw)
import atmosphereVertex from "./shaders/atmosphere.vert?raw"
import atmosphereFragment from "./shaders/atmosphere.frag?raw"
import karmanVertex from "./shaders/karman.vert?raw"
import karmanFragment from "./shaders/karman.frag?raw"
// @ts-ignore: example module without types
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
// @ts-ignore: example module without types
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
// @ts-ignore: example module without types
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass"
// @ts-ignore: example module without types
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass"
// @ts-ignore: example module without types
import { FXAAShader as fxaaShader } from "three/examples/jsm/shaders/FXAAShader"
import { DiameterIcon } from "lucide-react"

export default function Globe() {
    const mountRef = useRef<HTMLDivElement | null>(null)
    const [rotationSpeed, setRotationSpeed] = useState(0.001)
    const [tempSpeed, setTempSpeed] = useState<number>(0.001) // draft slider value
    const [isPaused, setIsPaused] = useState(false)
    const [showDebug, setShowDebug] = useState(false)
    const rotationSpeedRef = useRef(rotationSpeed)
    const isPausedRef = useRef(isPaused)
    const autoRotateRef = useRef(true)
    const sunUpdateRef = useRef<(() => void) | null>(null)
    const sunHelperRef = useRef<any>(null)
    const loadedMapRef = useRef<THREE.Texture | null>(null)
    const [loadedInfo, setLoadedInfo] = useState<{
        loaded: boolean
        width?: number
        height?: number
    }>({ loaded: false })
    const fpsRef = useRef({ lastTime: performance.now(), frames: 0, fps: 0 })
    const [displayFps, setDisplayFps] = useState<number>(0)

    // keep refs in sync with state
    useEffect(() => {
        rotationSpeedRef.current = rotationSpeed
    }, [rotationSpeed])
    useEffect(() => {
        isPausedRef.current = isPaused
        autoRotateRef.current = !isPaused
    }, [isPaused])

    useEffect(() => {
        const {
            Scene,
            PerspectiveCamera,
            WebGLRenderer,
            Mesh,
            SphereGeometry,
            MeshStandardMaterial,
            Color,
            Points,
            PointsMaterial,
            BufferGeometry,
            Float32BufferAttribute,
            AmbientLight,
            DirectionalLight,
        } = THREE as any

        const scene = new Scene()
        scene.background = new Color(0x000000)

        const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
        camera.position.z = 7 // move back to accommodate larger globe

        const renderer = new WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(window.devicePixelRatio || 1)

        const container = mountRef.current!
        container.appendChild(renderer.domElement)

        // Globe
        const globeGeo = new SphereGeometry(1.6, 64, 64) // larger globe
        // allow PNG alpha so ocean/background transparency shows through the atmosphere
        // make slightly translucent so the atmosphere/haze blends with the texture
        const globeMat = new MeshStandardMaterial({
            color: 0x042a6b,
            metalness: 0.1,
            roughness: 0.78,
            transparent: true,
            opacity: 0.9,
            alphaTest: 0.02,
        })
        const globe = new Mesh(globeGeo, globeMat)
        scene.add(globe)

        // Atmosphere + karman line using shader material with radial/fresnel gradient
        const atmosphereGeo = new SphereGeometry(1.7, 64, 64)
        const atmosphereMat = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                innerColor: { value: new THREE.Color(0x0b557b) },
                outerColor: { value: new THREE.Color(0x69b7ff) },
                cameraPos: { value: camera.position },
                intensity: { value: 0.1 },
                sunDir: { value: new THREE.Vector3(1, 1, 1) },
                sunPower: { value: 1.0 },
            },
            vertexShader: atmosphereVertex,
            fragmentShader: atmosphereFragment,
        })
        const atmosphere = new Mesh(atmosphereGeo, atmosphereMat)
        scene.add(atmosphere)

        // Karman line as a slightly larger thin sphere with stronger intensity (will be outlined)
        const karmanLineGeo = new SphereGeometry(1.72, 64, 64)
        const karmanLineMat = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                innerColor: { value: new THREE.Color(0x13353) },
                outerColor: { value: new THREE.Color(0x4b77bf) },
                cameraPos: { value: camera.position },
                intensity: { value: 1.5 },
                sunDir: { value: new THREE.Vector3(1, 1, 1) },
                sunPower: { value: 1.0 },
            },
            vertexShader: karmanVertex,
            fragmentShader: karmanFragment,
        })
        const karmanLine = new Mesh(karmanLineGeo, karmanLineMat)
        scene.add(karmanLine)

        // Stars
        const starsGeo = new BufferGeometry()
        const starCount = 800
        const positions = new Float32Array(starCount * 3)
        for (let i = 0; i < starCount; i++) {
            const r = 50
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            const x = r * Math.sin(phi) * Math.cos(theta)
            const y = r * Math.sin(phi) * Math.sin(theta)
            const z = r * Math.cos(phi)
            positions[3 * i] = x
            positions[3 * i + 1] = y
            positions[3 * i + 2] = z
        }
        starsGeo.setAttribute("position", new Float32BufferAttribute(positions, 3))
        // make stars tiny and white (single-pixel appearance)
        const starsMat = new PointsMaterial({
            color: 0xffffff,
            size: 0.15,
            sizeAttenuation: true,
            depthWrite: false,
        })
        const stars = new Points(starsGeo, starsMat)
        scene.add(stars)

        // Load world map SVG and apply as texture (use onLoad for robust setup)
        const textureLoader = new THREE.TextureLoader()
        textureLoader.load(
            "/images/world_map.png",
            tex => {
                try {
                    ;(tex as any).encoding = (THREE as any).sRGBEncoding
                } catch (e) {
                    // ignore if encoding not available
                }
                // make crisper: use mipmaps, linear mipmap filtering and anisotropy
                // defensive texture setup
                tex.generateMipmaps = true
                try {
                    tex.minFilter = (THREE as any).LinearMipmapLinearFilter || tex.minFilter
                } catch (e) {}
                try {
                    tex.magFilter = (THREE as any).LinearFilter || tex.magFilter
                } catch (e) {}
                try {
                    let maxAniso = 1
                    const caps = (renderer as any).capabilities
                    if (caps && typeof caps.getMaxAnisotropy === "function")
                        maxAniso = caps.getMaxAnisotropy()
                    else if (
                        (renderer as any).capabilities &&
                        (renderer as any).capabilities.maxAnisotropy
                    )
                        maxAniso = (renderer as any).capabilities.maxAnisotropy
                    tex.anisotropy = maxAniso || 1
                } catch (e) {}

                // detect likely-empty images (canvas or broken loader) and fall back
                const img = (tex as any).image
                const seemsEmpty = !(img && img.width > 4 && img.height > 4)
                if (seemsEmpty) {
                    // try fallback image
                    // eslint-disable-next-line no-console
                    console.warn(
                        "Primary world_map.png appears empty; attempting fallback world_map_modified.png"
                    )
                    textureLoader.load("/images/world_map_modified.png", alt => {
                        try {
                            ;(alt as any).encoding = (THREE as any).sRGBEncoding
                        } catch (e) {}
                        const img2 = (alt as any).image
                        try {
                            const w2 = img2.width,
                                h2 = img2.height
                            const canvas2 = document.createElement("canvas")
                            canvas2.width = w2
                            canvas2.height = h2
                            const ctx2 = canvas2.getContext("2d")
                            if (ctx2) {
                                ctx2.drawImage(img2, 0, 0, w2, h2)
                                const id2 = ctx2.getImageData(0, 0, w2, h2)
                                const data2 = id2.data
                                for (let i2 = 0; i2 < data2.length; i2 += 4) {
                                    if (data2[i2 + 3] === 0) {
                                        data2[i2] = 4
                                        data2[i2 + 1] = 42
                                        data2[i2 + 2] = 107
                                        data2[i2 + 3] = 255
                                    }
                                }
                                ctx2.putImageData(id2, 0, 0)
                                const newTex2 = new THREE.CanvasTexture(canvas2)
                                try {
                                    ;(newTex2 as any).encoding = (THREE as any).sRGBEncoding
                                } catch (e) {}
                                newTex2.flipY = true
                                try {
                                    ;(newTex2 as any).format = (THREE as any).RGBAFormat
                                } catch (e) {}
                                try {
                                    newTex2.anisotropy = (renderer as any).capabilities
                                        ?.getMaxAnisotropy
                                        ? (renderer as any).capabilities.getMaxAnisotropy()
                                        : 1
                                } catch (e) {}
                                newTex2.needsUpdate = true
                                if (globeMat.map) globeMat.map.dispose()
                                globeMat.map = newTex2
                                ;(globeMat as any).premultipliedAlpha = true
                                globeMat.color.set(0xffffff)
                                globeMat.needsUpdate = true
                                loadedMapRef.current = newTex2
                                setLoadedInfo({ loaded: true, width: w2, height: h2 })
                                return
                            }
                        } catch (e) {
                            // fallback to raw alt
                        }
                        alt.flipY = true
                        try {
                            ;(alt as any).format = (THREE as any).RGBAFormat
                        } catch (e) {}
                        alt.needsUpdate = true
                        if (globeMat.map) globeMat.map.dispose()
                        globeMat.map = alt
                        ;(globeMat as any).premultipliedAlpha = true
                        globeMat.color.set(0xffffff)
                        globeMat.needsUpdate = true
                        loadedMapRef.current = alt
                        const imgAlt = (alt as any).image
                        setLoadedInfo({
                            loaded: true,
                            width: imgAlt?.width || 0,
                            height: imgAlt?.height || 0,
                        })
                    })
                } else {
                    // assign primary after processing so fully-transparent pixels become deep blue
                    const img = (tex as any).image
                    try {
                        const w = img.width,
                            h = img.height
                        const canvas = document.createElement("canvas")
                        canvas.width = w
                        canvas.height = h
                        const ctx = canvas.getContext("2d")
                        if (ctx) {
                            ctx.drawImage(img, 0, 0, w, h)
                            const id = ctx.getImageData(0, 0, w, h)
                            const data = id.data
                            for (let i = 0; i < data.length; i += 4) {
                                if (data[i + 3] === 0) {
                                    data[i] = 4
                                    data[i + 1] = 42
                                    data[i + 2] = 107
                                    data[i + 3] = 255
                                }
                            }
                            ctx.putImageData(id, 0, 0)
                            const newTex = new THREE.CanvasTexture(canvas)
                            try {
                                ;(newTex as any).encoding = (THREE as any).sRGBEncoding
                            } catch (e) {}
                            newTex.flipY = true
                            try {
                                ;(newTex as any).format = (THREE as any).RGBAFormat
                            } catch (e) {}
                            try {
                                newTex.anisotropy = (renderer as any).capabilities?.getMaxAnisotropy
                                    ? (renderer as any).capabilities.getMaxAnisotropy()
                                    : 1
                            } catch (e) {}
                            newTex.needsUpdate = true
                            if (globeMat.map) globeMat.map.dispose()
                            globeMat.map = newTex
                            ;(globeMat as any).premultipliedAlpha = true
                            globeMat.color.set(0xffffff)
                            globeMat.needsUpdate = true
                            loadedMapRef.current = newTex
                            setLoadedInfo({ loaded: true, width: w, height: h })
                        } else {
                            tex.flipY = true
                            try {
                                ;(tex as any).format = (THREE as any).RGBAFormat
                            } catch (e) {}
                            tex.needsUpdate = true
                            if (globeMat.map) globeMat.map.dispose()
                            globeMat.map = tex
                            ;(globeMat as any).premultipliedAlpha = true
                            globeMat.color.set(0xffffff)
                            globeMat.needsUpdate = true
                            loadedMapRef.current = tex
                            const im = (tex as any).image
                            setLoadedInfo({
                                loaded: true,
                                width: im?.width || 0,
                                height: im?.height || 0,
                            })
                        }
                    } catch (e) {
                        tex.flipY = true
                        try {
                            ;(tex as any).format = (THREE as any).RGBAFormat
                        } catch (e) {}
                        tex.needsUpdate = true
                        if (globeMat.map) globeMat.map.dispose()
                        globeMat.map = tex
                        ;(globeMat as any).premultipliedAlpha = true
                        globeMat.color.set(0xffffff)
                        globeMat.needsUpdate = true
                        loadedMapRef.current = tex
                        const im2 = (tex as any).image
                        setLoadedInfo({
                            loaded: true,
                            width: im2?.width || 0,
                            height: im2?.height || 0,
                        })
                    }
                }
            },
            undefined,
            err => {
                // eslint-disable-next-line no-console
                console.warn("Failed to load world_map.png", err)
            }
        )

        // Postprocessing - composer with outline pass to highlight karman-line edge
        const composer = new EffectComposer(renderer)
        const renderPass = new RenderPass(scene, camera)
        composer.addPass(renderPass)

        const outlinePass = new OutlinePass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            scene,
            camera
        )
        outlinePass.edgeStrength = 0.5
        outlinePass.edgeGlow = 2
        outlinePass.edgeThickness = 0.5
        outlinePass.visibleEdgeColor.set("#7fd1ff")
        outlinePass.selectedObjects = [karmanLine]
        composer.addPass(outlinePass)

        const fxaaPass = new ShaderPass(fxaaShader)
        const pixelRatio = renderer.getPixelRatio()
        fxaaPass.material.uniforms["resolution"].value.x = 1 / (window.innerWidth * pixelRatio)
        fxaaPass.material.uniforms["resolution"].value.y = 1 / (window.innerHeight * pixelRatio)
        composer.addPass(fxaaPass)

        // Lighting (directional light driven by approximate sun position) - stronger sun intensity
        const ambient = new AmbientLight(0xffffff, 0.8)
        scene.add(ambient)
        const dir = new DirectionalLight(0xffffff, 1.5) // moderated sun intensity
        dir.position.set(5, 3, 5)
        scene.add(dir)
        // ensure the directional light targets the globe center (world origin)
        // and is not parented to the globe so it remains fixed relative to world time
        dir.target.position.set(0, 0, 0)
        scene.add(dir.target)
        // optional helper to visualize sun direction for debugging
        let sunHelper: any = null
        try {
            sunHelper = new THREE.DirectionalLightHelper(dir, 1.5, 0xffddaa)
            // keep the visual helper off by default (toggle will reveal it)
            try {
                sunHelper.visible = false
            } catch (e) {}
            scene.add(sunHelper)
            sunHelperRef.current = sunHelper
        } catch (e) {
            // ignore if helper isn't available in this build
            sunHelperRef.current = null
        }

        // compute sun vector from UTC time (approximate subsolar lat/lon)
        function sunVectorFromDate(d: Date) {
            const utcHours = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600
            // subsolar longitude: shift so that at UTC 12:00 the sun is near lon 0
            const subsolarLon = (utcHours / 24) * 360 - 180 // degrees

            // approximate declination from day of year (tilt of earth)
            const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0))
            const diff = d.getTime() - start.getTime()
            const oneDay = 1000 * 60 * 60 * 24
            const dayOfYear = Math.floor(diff / oneDay)
            const declination = 23.44 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81)) // degrees

            const lat = declination * (Math.PI / 180)
            const lon = subsolarLon * (Math.PI / 180)

            const x = Math.cos(lat) * Math.cos(lon)
            const y = Math.sin(lat)
            const z = Math.cos(lat) * Math.sin(lon)
            return new THREE.Vector3(x, y, z).normalize()
        }

        // update the directional light from the current real-world UTC position
        function updateSun() {
            const sunVec = sunVectorFromDate(new Date())
            // place sun in world coordinates based on UTC, but account for globe rotation so
            // the lit area on the texture stays consistent with the globe's orientation
            try {
                const rotated = sunVec.clone()
                // rotate around Y by the globe rotation so sun appears to move relative to globe
                rotated.applyAxisAngle(new THREE.Vector3(0, 1, 0), globe.rotation.y)
                dir.position.copy(rotated.multiplyScalar(100))
            } catch (e) {
                dir.position.copy(sunVec.multiplyScalar(100))
            }
            // ensure the directional light target faces the globe center
            try {
                dir.target.position.set(0, 0, 0)
                dir.target.updateMatrixWorld()
                dir.updateMatrixWorld()
            } catch (e) {
                // ignore if updateMatrixWorld isn't present
            }
            // adjust ambient intensity slightly based on sun elevation
            const sunElev = dir.position.y / 100 // -1..1
            ambient.intensity = 0.15 + Math.max(0, sunElev) * 0.6
            // update shader uniforms for atmosphere and karman line
            try {
                const sd = sunVec.clone()
                sd.applyAxisAngle(new THREE.Vector3(0, 1, 0), globe.rotation.y)
                if (atmosphereMat && (atmosphereMat as any).uniforms) {
                    ;(atmosphereMat as any).uniforms.sunDir.value.copy(sd).normalize()
                    ;(atmosphereMat as any).uniforms.sunPower.value = Math.max(0.0, sd.y)
                }
                if (karmanLineMat && (karmanLineMat as any).uniforms) {
                    ;(karmanLineMat as any).uniforms.sunDir.value.copy(sd).normalize()
                    ;(karmanLineMat as any).uniforms.sunPower.value = Math.max(0.0, sd.y)
                }
            } catch (e) {}
            // update helper if present
            if ((sunHelper as any) && typeof (sunHelper as any).update === "function") {
                ;(sunHelper as any).update()
            }
        }

        // expose update handler so UI can request an immediate recalculation
        sunUpdateRef.current = updateSun
        // run once, then update on an interval (every 60s) so the sun stays fixed relative to real time
        sunUpdateRef.current()
        let sunInterval: ReturnType<typeof setInterval> | null = setInterval(
            () => sunUpdateRef.current && sunUpdateRef.current(),
            60 * 1000
        )

        // Interaction
        let isDragging = false
        let previousMouseX = 0

        const onPointerDown = (e: PointerEvent) => {
            isDragging = true
            // pause auto-rotation while dragging; preserve paused state in isPausedRef
            autoRotateRef.current = false
            previousMouseX = e.clientX
        }
        const onPointerUp = () => {
            isDragging = false
            // resume auto-rotation unless the globe is explicitly paused
            autoRotateRef.current = !isPausedRef.current
            try {
                sunUpdateRef.current && sunUpdateRef.current()
            } catch (e) {
                /* ignore */
            }
        }
        const onPointerMove = (e: PointerEvent) => {
            if (!isDragging) return
            const deltaX = e.clientX - previousMouseX
            previousMouseX = e.clientX
            globe.rotation.y += deltaX * 0.005
            stars.rotation.y += deltaX * 0.002 // parallax
        }

        renderer.domElement.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointerup", onPointerUp)
        window.addEventListener("pointermove", onPointerMove)

        function onResize() {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
            if (composer) {
                composer.setSize(window.innerWidth, window.innerHeight)
            }
        }
        window.addEventListener("resize", onResize)

        // Animation
        let req = 0
        const animate = () => {
            // keep the sun updated each frame so its apparent motion matches time while globe rotates
            try {
                sunUpdateRef.current && sunUpdateRef.current()
            } catch (e) {
                /* ignore */
            }
            // FPS tracking
            try {
                const now = performance.now()
                fpsRef.current.frames += 1
                const dt = now - fpsRef.current.lastTime
                if (dt >= 500) {
                    // update display every 0.5s
                    const fps = (fpsRef.current.frames * 1000) / dt
                    // smooth a bit
                    fpsRef.current.fps = fpsRef.current.fps
                        ? fpsRef.current.fps * 0.6 + fps * 0.4
                        : fps
                    setDisplayFps(Math.round(fpsRef.current.fps))
                    fpsRef.current.frames = 0
                    fpsRef.current.lastTime = now
                }
            } catch (e) {}
            if (autoRotateRef.current) {
                const rs = rotationSpeedRef.current
                globe.rotation.y += rs
                stars.rotation.y += rs * 0.4
                atmosphere.rotation.y += rs * 0.6
                karmanLine.rotation.y += rs * 0.9 // karman line slightly out of sync for shimmer
            }
            if (composer) {
                composer.render()
            } else {
                renderer.render(scene, camera)
            }
            req = requestAnimationFrame(animate)
        }
        animate()

        return () => {
            cancelAnimationFrame(req)
            renderer.domElement.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointerup", onPointerUp)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("resize", onResize)
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
            // dispose geometries/materials
            globeGeo.dispose()
            globeMat.dispose()
            atmosphereGeo.dispose()
            atmosphereMat.dispose()
            karmanLineGeo.dispose()
            karmanLineMat.dispose()
            starsGeo.dispose()
            starsMat.dispose()
            if (globeMat.map) globeMat.map.dispose()
            if (composer) {
                composer.dispose()
            }
            if (sunHelper) {
                try {
                    scene.remove(sunHelper)
                    if (typeof sunHelper.dispose === "function") sunHelper.dispose()
                } catch (e) {
                    // ignore
                }
            }
            clearInterval(sunInterval)
        }
    }, [])

    // Hidden slider UI is rendered in DOM; a small corner thumb expands on hover via CSS
    return (
        <div className="three-canvas relative h-full w-full">
            <div ref={mountRef} className="absolute inset-0" />
            <div className="rotation-slider group fixed top-16 left-4 z-50">
                <div className="slider-handle flex h-8 w-8 items-center justify-center rounded-sm bg-gray-900 text-xs text-white opacity-90 ring-1 ring-gray-600">
                    ▼
                </div>
                <div className="mt-2 hidden items-center rounded bg-gray-900/60 p-2 group-hover:flex">
                    <button
                        aria-label="pause-toggle"
                        onClick={() => {
                            setIsPaused(prev => {
                                const next = !prev
                                isPausedRef.current = next
                                autoRotateRef.current = !next
                                return next
                            })
                        }}
                        className="mr-2 flex h-8 w-8 items-center justify-center rounded bg-gray-800 text-white">
                        {/* pause vs play icon */}
                        {!isPaused ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="currentColor">
                                <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>
                    <button
                        aria-label="debug-toggle"
                        onClick={() => {
                            setShowDebug(v => {
                                const next = !v
                                // toggle sun helper visibility as well
                                try {
                                    if (sunHelperRef.current) {
                                        sunHelperRef.current.visible = next
                                    }
                                } catch (e) {}
                                return next
                            })
                        }}
                        className="mr-2 flex h-8 w-8 items-center justify-center rounded bg-gray-800 text-white"
                        title="Toggle debug overlay and sun ray">
                        <DiameterIcon width={16} height={16} />
                    </button>
                    <input
                        aria-label="rotation-speed"
                        type="range"
                        min="0"
                        max="0.02"
                        step="0.0005"
                        value={tempSpeed}
                        onChange={e => {
                            const v = parseFloat(e.target.value)
                            setTempSpeed(v)
                            // auto-unpause while dragging if value > 0, auto-pause at 0
                            if (v > 0) {
                                setIsPaused(false)
                                isPausedRef.current = false
                                autoRotateRef.current = true
                            } else {
                                setIsPaused(true)
                                isPausedRef.current = true
                                autoRotateRef.current = false
                            }
                        }}
                        onPointerDown={() => {
                            /* start drag */
                        }}
                        onPointerUp={() => {
                            // commit on release
                            const v = Number(tempSpeed)
                            setRotationSpeed(v)
                            rotationSpeedRef.current = v
                            // auto-pause if zero, otherwise unpause
                            if (v === 0) {
                                setIsPaused(true)
                                isPausedRef.current = true
                                autoRotateRef.current = false
                            } else {
                                setIsPaused(false)
                                isPausedRef.current = false
                                autoRotateRef.current = true
                            }
                            try {
                                sunUpdateRef.current && sunUpdateRef.current()
                            } catch (e) {
                                /* ignore */
                            }
                        }}
                        className="rotation-range mr-2"
                        style={{ width: 140 }}
                    />
                </div>
            </div>
            {showDebug && (
                <div className="absolute top-48 left-0 z-60 max-w-xs rounded p-3 font-mono text-sm text-white">
                    <div className="mb-1 font-bold">Globe debug</div>
                    <div>FPS: {displayFps}</div>
                    <div>Rotation speed: {rotationSpeed.toFixed(5)}</div>
                    <div>Paused: {isPaused ? "yes" : "no"}</div>
                    <div>Texture: {loadedInfo.loaded ? "loaded" : "missing"}</div>
                    {loadedInfo.loaded && (
                        <div className="mt-2">
                            <div>
                                Image: {loadedInfo.width || 0} x {loadedInfo.height || 0}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
