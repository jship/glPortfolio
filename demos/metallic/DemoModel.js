ShipGL.DemoModel = function(gl, pathToJSON)
{
    ShipGL.Model.call(this, gl, pathToJSON);

    this.program = new ShipGL.ShaderProgram(gl);
    
    this.projMat = mat4.create();
    this.viewMat = mat4.create();
    this.viewDir = vec3.create();

    this.metalArray = null;
    this.colorSystem = null;
    this.temperature = 5500;

    this.environment = null;

    this.drawType = this.gl.TRIANGLES;
};

ShipGL.DemoModel.prototype = Object.create(ShipGL.Model.prototype);

ShipGL.DemoModel.prototype.initialize = function(vShaderCode, fShaderCode)
{
    ShipGL.Model.prototype.initialize.call(this);
    
    this.program.create(vShaderCode, fShaderCode);
    
    this.environment = new ShipGL.CubeTexture(this.gl);
    this._setCubemapDirectory("../../textures/cubemaps/rainbow", ".jpg");
};

ShipGL.DemoModel.prototype.draw = function(elapsed)
{
    this.program.bind();
    this.program.enableAttributeArray("aPosition");
    this.program.enableAttributeArray("aNormal");
    this.environment.bind(0);

    this.program.setUniformMat4("uProjMat", this.projMat);
    this.program.setUniformMat4("uViewMat", this.viewMat);
    this.program.setUniformVec3f("uViewVec", this.viewDir);
    this.program.setUniform1i("uCubeTex", 0);
    this.program.setUniformVec3f("uColorMatch", cie_colour_match);
    this.program.setUniformVec3f("uMetalArray", this.metalArray);
    this.program.setUniformMat3("uXyzToRgbMat", this.colorSystem.transform);
    this.program.setUniform1f("uGamma", this.colorSystem.gamma);
    this.program.setUniform1f("uTemp", this.temperature);

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

    this.environment.unbind();
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

ShipGL.DemoModel.prototype.setMetalArray = function(array)
{
    this.metalArray = array;
};

ShipGL.DemoModel.prototype.setColorSystem = function(colorSystem)
{
    this.colorSystem = colorSystem;
};

ShipGL.DemoModel.prototype.setTemperature = function(temp)
{
    this.temperature = temp;
};

ShipGL.DemoModel.prototype._setCubemapDirectory = function(path, ext)
{
    var posString = "/positive_";
    var negString = "/negative_";

    this.environment.loadPositiveX(path + posString + "x" + ext);
    this.environment.loadPositiveY(path + posString + "y" + ext);
    this.environment.loadPositiveZ(path + posString + "z" + ext);

    this.environment.loadNegativeX(path + negString + "x" + ext);
    this.environment.loadNegativeY(path + negString + "y" + ext);
    this.environment.loadNegativeZ(path + negString + "z" + ext);
};
