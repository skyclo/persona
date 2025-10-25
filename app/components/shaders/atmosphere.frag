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
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.0);
    vec3 base = innerColor * 0.18;
    vec3 col = mix(innerColor, outerColor, fresnel * intensity) + base;
    float sunN = max(dot(normalize(vNormal), normalize(sunDir)), 0.0);
    float sunPow = pow(sunN, 1.5) * sunPower;
    vec3 sunTint = vec3(1.0, 0.95, 0.85) * 0.35 * sunPow;
    col += sunTint;
    float alpha = 1.0 * (0.65 * fresnel + 0.15) + sunN * 0.25 * sunPower;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
