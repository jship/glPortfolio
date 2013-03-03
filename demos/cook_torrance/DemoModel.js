ShipGL.DemoModel = function(gl, pathToJSON)
{
    ShipGL.Model.call(this, gl, pathToJSON);

    this.program = new ShipGL.ShaderProgram(gl);
    this.projMat = mat4.create();
    this.viewMat = mat4.create();
    this.viewDir = vec3.create();

    this.light = null;
    this.realRefrIdx = vec3.create();
    this.imagRefrIdx = vec3.create();

    this.drawType = this.gl.TRIANGLES;
};

ShipGL.DemoModel.prototype = Object.create(ShipGL.Model.prototype);

ShipGL.DemoModel.prototype.initialize = function(vShaderCode, fShaderCode)
{
    ShipGL.Model.prototype.initialize.call(this);

    this.program.create(vShaderCode, fShaderCode);
};

ShipGL.DemoModel.prototype.draw = function(elapsed)
{
    this.program.bind();
    this.program.enableAttributeArray("aPosition");
    this.program.enableAttributeArray("aNormal");

    this.program.setUniformMat4("uProjMat", this.projMat);
    this.program.setUniformMat4("uViewMat", this.viewMat);

    this.program.setUniformVec3f("uViewVec", this.viewDir);

    this.program.setUniformVec4f("uLight", this.light.position ||
                                           this.light.direction);
    
    this.program.setUniformVec3f("uRealRefractIdx", this.realRefrIdx);
    this.program.setUniformVec3f("uImagRefractIdx", this.imagRefrIdx);

    this.vbo.bind();
    
    var i, j, curNode, curMesh, curMaterial;
    for (i = 0; i < this.json.nodes.length; i++)
    {
        curNode = this.json.nodes[i];
        this.program.setUniformMat4("uModelMat", curNode.modelMatrix);
        this.program.setUniformMat4("uModelMatInvTrp", curNode.normalMatrix);

        for (j = 0; j < curNode.meshIndices.length; j++)
        {
            curMesh = this.json.meshes[curNode.meshIndices[j]];
            this.program.setAttributeBuffer3f("aPosition", curMesh.stride,
                                              curMesh.positionsOffset);
            
            this.program.setAttributeBuffer3f("aNormal", curMesh.stride,
                                              curMesh.normalsOffset);
            
            curMaterial = this.json.materials[curMesh.materialIndex];

            this.program.setUniformVec4f("uDiffuseRefl", curMaterial.diffuseReflectance);
            this.program.setUniform1f("uShininess", curMaterial.shininess);

            if (curMesh.hasIndices)
            {
                this.ibo.bind();
                this.gl.drawElements(this.drawType, curMesh.indices.length,
                                     this.gl.UNSIGNED_SHORT,
                                     Uint16Array.BYTES_PER_ELEMENT * curMesh.indicesOffset);
                this.ibo.unbind();
            }
            else
            {
                this.gl.drawArrays(this.drawType, 0, curMesh.vertexPositions.length / 3);
            }
        }
    }

    this.vbo.unbind();
    this.program.disableAttributeArray("aNormal");
    this.program.disableAttributeArray("aPosition");
    this.program.unbind();
};

ShipGL.DemoModel.prototype.setProjection = function(projMat)
{
    mat4.set(projMat, this.projMat);
};

ShipGL.DemoModel.prototype.setView = function(viewMat)
{
    mat4.set(viewMat, this.viewMat);
};

ShipGL.DemoModel.prototype.setViewDirection = function(dir)
{
    vec3.set(dir, this.viewDir);
};

ShipGL.DemoModel.prototype.setLight = function(light)
{
    this.light = light;
};

ShipGL.DemoModel.prototype.setMetalParameters = function(realRefrIdx, imagRefrIdx)
{
    vec3.set(realRefrIdx, this.realRefrIdx);
    vec3.set(imagRefrIdx, this.imagRefrIdx);
};

