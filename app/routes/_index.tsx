import type { Route } from "./+types/_index"
import Navbar from "~/components/Navbar"
import Globe from "~/components/Globe"
import RightPanel from "~/components/RightPanel"
import BottomPanel from "~/components/BottomPanel"
import { useState, useEffect, useRef } from "react"
import ToggleButton from "~/components/ToggleButton"

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Persona - Survey" },
        { name: "description", content: "Survey visualization and responses" },
    ]
}

export function loader({ context }: Route.LoaderArgs) {
    // Use a declared env var from wrangler.jsonc; return it for the UI to consume if needed
    return { message: context.cloudflare.env.N8N_WEBHOOK_URL }
}

export default function Home({ loaderData }: Route.ComponentProps) {
    // layout constants (px)
    const RIGHT_PANEL_WIDTH = 480 // increased width in px
    const RIGHT_PANEL_COLLAPSED_WIDTH = 56

    const [rightCollapsed, setRightCollapsed] = useState(true)
    const [bottomCollapsed, setBottomCollapsed] = useState(false)
    const [result, setResult] = useState<JSON[] | null>(null)
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    // normalize result shape: the API may return either an array containing
    // { results: [...] } objects (legacy/sample), or already return an array
    // of respondent objects. This helper flattens both shapes to a single
    // respondents[] array for downstream components.
    function flattenRespondents(res: any[] | null): any[] {
        if (!res) return []
        // if first element has a `results` array, assume wrapped shape
        if (res.length > 0 && (res[0] as any).results) {
            return res.map(r => (r as any).results || []).flat()
        }
        // otherwise assume it's already an array of respondents
        return res as any[]
    }

    // Auto-collapse right panel only when a previously-selected respondent is deselected.
    // This prevents the effect from blocking manual toggling when no respondent is selected initially.
    const prevSelectedRef = useRef<number | null>(selectedIndex)
    useEffect(() => {
        if (prevSelectedRef.current !== null && selectedIndex === null) {
            setRightCollapsed(true)
        }
        prevSelectedRef.current = selectedIndex
    }, [selectedIndex])
    const QUESTIONS = [
        {
            required: true,
            type: "multiple",
            content: "Have you heard of the term business intelligence (BI) before?",
            maxSelection: 1,
            choices: [
                "Yes, I am very familiar with business intelligence and have used it before",
                "Yes, I am familiar with business intelligence but I have not used it before",
                "No, I am not familiar with business intelligence",
            ],
        },
        {
            required: true,
            type: "multiple",
            content: "How often do you use AI?",
            maxSelection: 1,
            choices: [
                "Daily",
                "Once or twice a week",
                "Once or twice a month",
                "Rarely",
                "I have never used AI",
            ],
        },
        {
            required: true,
            type: "scale",
            content: "On a scale of 1-10, how favorable of an opinion do you have on AI?",
            maxSelection: 1,
            min: "1",
            max: "10",
        },
        {
            required: true,
            type: "binary",
            content: "Do you use AI at work?",
            maxSelection: 1,
        },
        {
            required: false,
            type: "multiple",
            content:
                "If you answered YES to the previous question, what are the top 3 things you use it for?",
            maxSelection: 3,
            choices: [
                "Automation",
                "Vibe coding",
                "Data science analysis",
                "Asking non-technical questions",
                "Asking technical questions",
                "Asking company-relevant questions",
                "Agentic programming",
            ],
        },
        {
            required: false,
            type: "short_response",
            content: "If you answered NO to the prior question, why do you NOT use AI at work?",
            maxChars: 140,
        },
    ]

    return (
        <div className="flex h-full max-h-screen min-h-screen w-full flex-col overflow-hidden bg-black text-white">
            <Navbar
                args={{
                    numberPersonas: 25,
                    industry: "anything",
                    region: "worldwide",
                    age: { low: 18, high: 60 },
                }}
                questions={QUESTIONS}
                result={result}
                setResult={setResult}
                error={error}
                setError={setError}
            />

            {/* main content: split left and right */}
            <main className="flex flex-1">
                <div className="flex flex-1 flex-col">
                    {/* top: globe fills available left column space */}
                    <div className="flex flex-1 items-center justify-center p-6">
                        <div className="h-full w-full max-w-none">
                            <Globe
                                style={{
                                    transform: rightCollapsed
                                        ? "translateX(0)"
                                        : `translateX(-${RIGHT_PANEL_WIDTH / 2}px)`,
                                }}
                                points={(() => {
                                    const respondents = flattenRespondents(result)
                                    return respondents.length
                                        ? respondents.map((r: any) => r.point).filter(Boolean)
                                        : undefined
                                })()}
                                selectedPoint={((): any | null => {
                                    const respondents = flattenRespondents(result)
                                    if (selectedIndex == null) return null
                                    const r = respondents[selectedIndex]
                                    return r?.point ?? null
                                })()}
                                onMarkerClick={p => {
                                    try {
                                        if (!p) return
                                        const respondents = flattenRespondents(result)
                                        const idx = respondents.findIndex((r: any) => {
                                            if (!r || !r.point) return false
                                            return (
                                                Number(r.point.lat) === Number(p.lat) &&
                                                Number(r.point.lng) === Number(p.lng)
                                            )
                                        })
                                        if (idx >= 0) {
                                            setSelectedIndex(idx)
                                            setRightCollapsed(false)
                                        }
                                    } catch (e) {}
                                }}
                            />
                        </div>
                    </div>
                    <div className="mt-14 w-full"></div>
                    {/* bottom: bottom panel area (rendered inline only when expanded) */}
                    {!bottomCollapsed ? (
                        <div className="px-6 pb-6">
                            <div className="flex justify-center">
                                <ToggleButton
                                    ariaLabel="toggle-bottom-panel"
                                    title={
                                        bottomCollapsed
                                            ? "Expand bottom panel"
                                            : "Collapse bottom panel"
                                    }
                                    expanded={!bottomCollapsed}
                                    onClick={() => setBottomCollapsed(v => !v)}
                                    direction={bottomCollapsed ? "up" : "down"}
                                />
                            </div>

                            <BottomPanel
                                collapsed={false}
                                data={result ?? undefined}
                                questions={QUESTIONS}
                                onSelectRespondent={i => {
                                    setSelectedIndex(i)
                                    setRightCollapsed(false)
                                }}
                            />
                        </div>
                    ) : (
                        <ToggleButton
                            ariaLabel="toggle-bottom-panel"
                            title="Expand bottom panel"
                            expanded={!bottomCollapsed}
                            onClick={() => setBottomCollapsed(v => !v)}
                            direction="up"
                            style={{
                                position: "fixed",
                                left: "50%",
                                transform: "translateX(-50%)",
                                bottom: 8,
                            }}
                        />
                    )}
                </div>
                {/* right column: toggle + optional panel */}
                <div
                    className="mt-14 mr-4 mb-2 ml-0 flex"
                    style={{
                        width: rightCollapsed
                            ? RIGHT_PANEL_COLLAPSED_WIDTH + 12
                            : RIGHT_PANEL_WIDTH + 12,
                    }}>
                    <div className="flex items-center justify-center">
                        <ToggleButton
                            ariaLabel="toggle-right-panel"
                            title={rightCollapsed ? "Expand right panel" : "Collapse right panel"}
                            expanded={!rightCollapsed}
                            onClick={() => setRightCollapsed(v => !v)}
                            direction={rightCollapsed ? "right" : "left"}
                            style={
                                rightCollapsed
                                    ? {
                                          position: "fixed",
                                          right: 8,
                                          top: "50%",
                                          transform: "translateY(-50%)",
                                      }
                                    : undefined
                            }
                        />
                    </div>

                    {/* right panel container only when expanded */}
                    {!rightCollapsed && (
                        <div className="h-full" style={{ width: RIGHT_PANEL_WIDTH }}>
                            <RightPanel
                                collapsed={rightCollapsed}
                                width={RIGHT_PANEL_WIDTH}
                                collapsedWidth={RIGHT_PANEL_COLLAPSED_WIDTH}
                                data={result ?? undefined}
                                selectedIndex={selectedIndex ?? undefined}
                                onDeselect={() => setSelectedIndex(null)}
                                questions={QUESTIONS}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
