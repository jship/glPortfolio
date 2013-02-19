precision mediump float;

uniform vec4 uLight;
uniform vec3 uLightIntensity;
uniform vec4 uDiffuseRefl;
uniform vec3 uViewVec;
uniform float uStdDev;

varying vec4 worldSpacePos;
varying vec4 worldSpaceNormal;

void main()
{
    vec4 color = uDiffuseRefl;
        
    vec3 lightDir;
    if (uLight.w == 0.0)
        lightDir = normalize(uLight.xyz);
    else
        lightDir = normalize(worldSpacePos.xyz - uLight.xyz);

    vec3 normal = normalize(worldSpaceNormal.xyz);
    vec3 viewDir = normalize(uViewVec);

    float nDotL = clamp(dot(normal, -lightDir), 0.0, 1.0);
    float nDotV = clamp(dot(normal, -viewDir), 0.0, 1.0);

    float incidentTheta = acos(nDotL);
    float outTheta = acos(nDotV);

    float A = 1.0 - (uStdDev * uStdDev) / (2.0 * (uStdDev * uStdDev + 0.33));
    float B = (0.45 * uStdDev * uStdDev) / (uStdDev * uStdDev + 0.09);
    float alpha = max(incidentTheta, outTheta);
    float beta  = min(incidentTheta, outTheta);
    
    vec3 u = normalize(-viewDir - normal * nDotV);
    vec3 v = normalize(-lightDir - normal * nDotL);
    float phiDiff = max(0.0, dot(u, v));
    
    vec3 diffuse = (A + B * phiDiff * sin(alpha) * tan(beta)) * color.xyz;

    gl_FragColor = vec4(diffuse * uLightIntensity * nDotL, 1.0);
}
