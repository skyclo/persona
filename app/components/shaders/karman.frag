varying vec3 vNormal;
varying vec3 vWorldPos;
uniform vec3 innerColor;
uniform vec3 outerColor;
uniform vec3 cameraPos;
uniform float intensity;
uniform vec3 sunDir;
uniform float sunPower;

void main() {
    vec3 viewDir = normalize(cameraPos - vWorldPos);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
    vec3 col = mix(innerColor, outerColor, fresnel * intensity);
    float sunN = max(dot(normalize(vNormal), normalize(sunDir)), 0.0);
    float sunGlow = pow(sunN, 6.0) * sunPower;
    vec3 glowColor = vec3(0.6, 0.85, 1.0) * sunGlow * 0.9;
    col += glowColor;
    float alpha = 1.0 * (0.9 * fresnel) + sunN * 0.35 * sunPower;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
