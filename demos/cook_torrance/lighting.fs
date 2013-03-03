precision mediump float;

uniform vec4 uLight;
uniform vec3 uViewVec;
uniform vec3 uRealRefractIdx;
uniform vec3 uImagRefractIdx;
uniform float uShininess;

varying vec4 worldSpacePos;
varying vec4 worldSpaceNormal;

void main()
{
    vec3 lightDir;
    if (uLight.w == 0.0)
        lightDir = normalize(uLight.xyz);
    else
        lightDir = normalize(worldSpacePos.xyz - uLight.xyz);

    vec3 normal  = normalize(worldSpaceNormal.xyz);
    vec3 viewDir = normalize(uViewVec);
    vec3 halfDir = normalize(-(lightDir + viewDir) / 2.0);

    // Fresnel computation
    vec3 two = vec3(2.0, 2.0, 2.0);
    vec3 realRefractIdxSquared = pow(uRealRefractIdx, two);
    vec3 imagRefractIdxSquared = pow(uImagRefractIdx, two);
    vec3 refrIdxSqSum = realRefractIdxSquared + imagRefractIdxSquared;
    float incidentCos = clamp(dot(normal, halfDir), 0.0, 1.0);
    float incidentCosSq = pow(incidentCos, 2.0);
    vec3 twiceNormalIncidentCos = 2.0 * uRealRefractIdx * incidentCos;
    vec3 fresPt1 = (refrIdxSqSum * incidentCosSq - twiceNormalIncidentCos + 1.0) /
                   (refrIdxSqSum * incidentCosSq + twiceNormalIncidentCos + 1.0);
    vec3 fresPt2 = (refrIdxSqSum - twiceNormalIncidentCos + incidentCosSq) /
                   (refrIdxSqSum + twiceNormalIncidentCos + incidentCosSq);
    vec3 fresnel = (pow(fresPt1, two) + pow(fresPt2, two)) / 2.0;

    // Masking/shadowing computation
    float nDotH = clamp(dot(normal, halfDir), 0.0, 1.0);
    float nDotV = clamp(dot(normal, -viewDir), 0.0, 1.0);
    float nDotL = clamp(dot(normal, -lightDir), 0.0, 1.0);
    float vDotH = clamp(dot(-viewDir, halfDir), 0.0, 1.0);
    float geoAttenTerm1 = (2.0 * nDotH * nDotV) / vDotH;
    float geoAttenTerm2 = (2.0 * nDotH * nDotL) / vDotH;
    float masking = min(1.0, min(geoAttenTerm1, geoAttenTerm2));
    
    // Distribution computation
    float distribution = pow(nDotH, uShininess);

    vec3 cookTorrance = (fresnel * distribution * masking) /
                        (2.0     * nDotL        * nDotV);

    gl_FragColor = vec4(cookTorrance.xyz, 1.0);
}
