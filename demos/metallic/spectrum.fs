precision mediump float;

uniform samplerCube uCubeTex;
uniform vec3 uViewVec;
uniform vec3 uColorMatch[31];
uniform vec3 uMetalArray[31];
uniform mat3 uXyzToRgbMat;
uniform float uGamma;
uniform float uTemp;

varying vec4 worldSpaceNormal;

float blackBodyRadiation(float temp, float lambda)
{
	float lambdaInMeters = lambda * 1e-9;
	return (3.74183e-16 * pow(lambdaInMeters, -5.0)) /
           (exp(1.4388e-2 / (lambdaInMeters * temp)) - 1.0);
}

float fresnel(float N, float K, vec3 normal, vec3 viewDir)
{
    float nSq = N * N;
    float kSq = K * K;

    float refractIdxSqSum = nSq + kSq;

    float incidentCos = max(dot(normal, -viewDir), 0.0);
    float incidentCosSq = incidentCos * incidentCos;

    float twiceNIncidentCos = 2.0 * N * incidentCos;

    float part1 = (refractIdxSqSum * incidentCosSq - twiceNIncidentCos + 1.0) /
                  (refractIdxSqSum * incidentCosSq + twiceNIncidentCos + 1.0);

    float part2 = (refractIdxSqSum - twiceNIncidentCos + incidentCosSq) /
                  (refractIdxSqSum + twiceNIncidentCos + incidentCosSq);

    return ((part1 * part1) + (part2 * part2)) / 2.0;
}

vec3 constrainRGB(vec3 rgb)
{
    float w;

    w = (0.0 < rgb.r) ? 0.0 : rgb.r;
    w = (w   < rgb.g) ? w   : rgb.g;
    w = (w   < rgb.b) ? w   : rgb.b;
    w = -w;

    if (w > 0.0)
    {
        rgb.r += w;
        rgb.g += w;
        rgb.b += w;
    }

    return rgb;
}

vec3 convertSpectrumToXYZ(vec3 normal, vec3 viewDir)
{
    vec3 xyz;

    float lambda, refN, refK, matchX, matchY, matchZ;
    float N = 0.0, invN = 0.0, X = 0.0, Y = 0.0, Z = 0.0, sumXYZ = 0.0;
    float emittance, reflectance;

    for (int i = 0; i < 31; i++)
    {
        lambda = uMetalArray[i].x;
        refN   = uMetalArray[i].y;
        refK   = uMetalArray[i].z;

        matchX = uColorMatch[i].x;
        matchY = uColorMatch[i].y;
        matchZ = uColorMatch[i].z;

        emittance   = blackBodyRadiation(uTemp, lambda);
        reflectance = fresnel(refN, refK, normal, viewDir);

        X += (emittance * matchX * reflectance);
        Y += (emittance * matchY * reflectance);
        Z += (emittance * matchZ * reflectance);

        N += emittance * matchY;
    }
    
    invN = 1.0 / N;
    
    xyz.x = invN * X;
    xyz.y = invN * Y;
    xyz.z = invN * Z;

    return xyz;
}

vec3 convertXYZToRGB(vec3 xyz)
{
    vec3 rgb = uXyzToRgbMat * xyz;
    return constrainRGB(rgb);
}

vec3 environmentRGB()
{
    vec3 texCoords = reflect(uViewVec, normalize(worldSpaceNormal.xyz));
    return textureCube(uCubeTex, texCoords).xyz;
}

vec3 grayscaleRGB(vec3 rgb)
{
    return vec3(0.3 * rgb.r + 0.68 * rgb.g + 0.02 * rgb.b);
}

float gammaCorrectComponent(float c)
{
    if (uGamma == 0.0)
    {
        float cc = 0.018;
        
        if (c < cc)
        {
            c *= ((1.099 * pow(cc, 0.45)) - 0.099) / cc;
        }
        else
        {
            c = (1.099 * pow(c, 0.45)) - 0.099;
        }
    }
    else
    {
        c = pow(c, 1.0 / uGamma);
    }

    return c;
}

vec3 gammaCorrectRGB(vec3 rgb)
{
    rgb.r = gammaCorrectComponent(rgb.r);
    rgb.g = gammaCorrectComponent(rgb.g);
    rgb.b = gammaCorrectComponent(rgb.b);

    return rgb;
}

void main()
{
    vec3 normal = normalize(worldSpaceNormal.xyz);
    vec3 viewDir = normalize(uViewVec);

    vec3 color;
    color =  convertSpectrumToXYZ(normal, viewDir);
    color =  convertXYZToRGB(color);
    color *= grayscaleRGB(environmentRGB());
    color =  gammaCorrectRGB(color);
    gl_FragColor = vec4(color, 1.0);
}
