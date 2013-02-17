uniform mat4 uProjMat;
uniform mat4 uViewMat;
uniform mat4 uModelMat;
uniform mat4 uModelMatInvTrp;

attribute vec3 aPosition;
attribute vec3 aNormal;

varying vec4 worldSpaceNormal;

void main()
{
    gl_Position = uProjMat * uViewMat * uModelMat * vec4(aPosition, 1.0);

    worldSpaceNormal = normalize(uModelMatInvTrp * vec4(aNormal, 1.0));
}
