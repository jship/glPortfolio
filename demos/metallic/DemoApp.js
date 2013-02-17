ShipGL.DemoApp = function(canvasId, contextOptions)
{
    ShipGL.BaseApp.call(this, canvasId, contextOptions);
    
    this.modelOptions = document.getElementById("modelSelector");
    this.models = [];
    this.curModel = null;
    this.prevModel = null;
    
    this.camera = null;
    
    this.projMatrix = mat4.create();
    
    this.metalData = null;
    
    this.metalOptions = document.getElementById("metalSelector");
    this.curMetal = this.metalOptions.selectedIndex;
    this.prevMetal = this.curMetal;

    this.colorSystemOptions = document.getElementById("colorSystemSelector");
    this.curColorSystem = colorSystems[this.colorSystemOptions[0].value];
    this.prevColorSystem = null;

    this.temperatureRange = document.getElementById("tempRange");
    
    this.curTemp = this._getCurrentColorTemp();
    this.prevTemp = null;
};

ShipGL.DemoApp.prototype = Object.create(ShipGL.BaseApp.prototype);

ShipGL.DemoApp.prototype.initialize = function()
{
    this._initializeModels();
    this._initializeCamera();

    this.colorSystemOptions.selectedIndex = 0;

    this.metalData = JSON.parse(
        ShipGL.FileLoader.loadLocal("MetalData.json", "application/json") ||
        ShipGL.FileLoader.loadHttp("MetalData.json", "application/json"));
    
    // Use only the 400nm-700nm interval, with a 10nm resolution.
    cie_colour_match = new Float32Array(
        cie_colour_match.filter(
            function(val, idx)
            {
                var r = 5 * idx + 380;
                return (idx % 2 == 0) && (r >= 400 && r <= 700);
            }
        ).reduce(function(a, b) { return a.concat(b); })
    );

    this._getCurrentDOMInput();
    this._onInputChanged();
};

ShipGL.DemoApp.prototype.update = function(elapsed)
{
    this.handleHeldKeys(elapsed);
    
    this._getCurrentDOMInput();
    
    if (this._inputChanged())
    {
        this._onInputChanged();
    }
    
    mat4.perspective(90, this.canvas.width / this.canvas.height,
                     0.01 * this.curModel.diagonal,
                     3 * this.curModel.diagonal, this.projMatrix);
    
    this.curModel.setProjection(this.projMatrix);
    this.curModel.setView(this.camera.viewMatrix);
    this.curModel.setViewDirection(this.camera.direction);
};

ShipGL.DemoApp.prototype.draw = function(elapsed)
{
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.curModel.draw(elapsed);
};

ShipGL.DemoApp.prototype.handleHeldKeys = function(elapsed)
{
    if (this.heldKeys[87])
        this.camera.moveForward();
    if (this.heldKeys[83])
        this.camera.moveBackward();
    if (this.heldKeys[65])
        this.camera.moveLeft();
    if (this.heldKeys[68])
        this.camera.moveRight();
    if (this.heldKeys[72])
        this.camera.lookLeft();
    if (this.heldKeys[76])
        this.camera.lookRight();
    if (this.heldKeys[75])
        this.camera.moveUp();
    if (this.heldKeys[74])
        this.camera.moveDown();
};

ShipGL.DemoApp.prototype._getCurrentDOMInput = function()
{
    this.prevModel = this.curModel;
    this.curModel = this.models[this.modelOptions.selectedIndex];
    
    this.prevMetal = this.curMetal;
    this.curMetal = this.metalOptions.selectedIndex;

    this.prevColorSystem = this.curColorSystem;
    this.curColorSystem = this._getCurrentColorSystem();

    this.prevTemp = this.curTemp;
    this.curTemp = this._getCurrentColorTemp();
};

ShipGL.DemoApp.prototype._getCurrentColorSystem = function()
{
    var i = this.colorSystemOptions.selectedIndex;
    return colorSystems[this.colorSystemOptions[i].value];
};

ShipGL.DemoApp.prototype._getCurrentColorTemp = function()
{
    return $("#tempRange").spinner("value");
};

ShipGL.DemoApp.prototype._inputChanged = function()
{
    return (this.prevModel       != this.curModel)       ||
           (this.prevMetal       != this.curMetal)       ||
           (this.prevColorSystem != this.curColorSystem) ||
           (this.prevTemp        != this.curTemp);
};

ShipGL.DemoApp.prototype._onInputChanged = function()
{
    this.curModel.setMetalArray(this.metalData[this.metalOptions[this.curMetal].value]);
    this.curModel.setColorSystem(this.curColorSystem);
    this.curModel.setTemperature(this.curTemp);
};

ShipGL.DemoApp.prototype._initializeModels = function()
{
    var vShaderCode = ShipGL.FileLoader.loadLocal("spectrum.vs") ||
                      ShipGL.FileLoader.loadHttp("spectrum.vs");
    var fShaderCode = ShipGL.FileLoader.loadLocal("spectrum.fs") ||
                      ShipGL.FileLoader.loadHttp("spectrum.fs");

    var i, model;
    for (i = 0; i < this.modelOptions.length; i++)
    {
        model = new ShipGL.DemoModel(this.gl, this.modelOptions[i].value);
        model.initialize(vShaderCode, fShaderCode);
        this.models.push(model);
    }
    
    this.curModel = this.models[this.modelOptions.selectedIndex];
};

ShipGL.DemoApp.prototype._initializeCamera = function()
{
    var camPos = vec3.create(this.curModel.center);
    var camTranslate = vec3.createFrom(0, 0, 2 * this.curModel.diagonal);
    vec3.add(camPos, camTranslate);
    
    camDir = vec4.create();
    vec3.direction(this.curModel.center, camPos, camDir);

    var camUp = vec3.createFrom(0, 1, 0);

    camMoveSpeed = (this.curModel.diagonal / 100) + 1;
    
    this.camera = new ShipGL.Camera(camPos, this.curModel.center, camUp);
    this.camera.setMoveSpeed(camMoveSpeed);
};

$(document).ready(function() {
    function controlsTableHtml()
    {
        return [
            '<table>',
            '    <tr>',
            '        <th colspan="2">Controls</th>',
            '    </tr>',
            '    <tr>',
            '        <td>W</td>',
            '        <td>Move forward</td>',
            '    </tr>',
            '    <tr>',
            '        <td>S</td>',
            '        <td>Move backward</td>',
            '    </tr>',
            '    <tr>',
            '        <td>A</td>',
            '        <td>Move left</td>',
            '    </tr>',
            '    <tr>',
            '        <td>D</td>',
            '        <td>Move right</td>',
            '    </tr>',
            '    <tr>',
            '        <td>K</td>',
            '        <td>Move up</td>',
            '    </tr>',
            '    <tr>',
            '        <td>J</td>',
            '        <td>Move down</td>',
            '    </tr>',
            '    <tr>',
            '        <td>H</td>',
            '        <td>Look left</td>',
            '    </tr>',
            '    <tr>',
            '        <td>L</td>',
            '        <td>Look right</td>',
            '    </tr>',
            '</table>',
            'You can tell I love vim.'
        ].join("\n");
    };

    $("select").combobox();

    $("#tempRange").spinner({ min: 1000, max: 10000, step: 100 });
    $("#tempRange").spinner("value", 6800);

    $("#helpBox").attr("title", controlsTableHtml());
    $("#helpBox").tooltip({ track: true });
    $("#helpBox").click(function() { $("#helpBox").hide("highlight"); });
    
    $("#demoGuiTabs").tabs({
        active: false,
        collapsible: true,
        beforeLoad: function(event, ui)
        {
            ui.jqXHR.fail(function()
            {
                ui.panel.innerHtml = "Couldn't load this tab. We'll try to fix this as soon as possible. " +
                    "If this wouldn't be a demo.";
            });
        },
        load: function(event, ui)
        {
            ui.panel.innerHTML = '<pre><code class="language-clike">' + ui.panel.innerHTML + '</code></pre>';
        }
    });

    var app = new ShipGL.DemoApp("glCanvas");
    app.initialize();
    
    document.onkeydown = function(e) { app.handleKeyPressed(e.keyCode); };
    document.onkeyup   = function(e) { app.handleKeyReleased(e.keyCode); };
    
    var gl = app.gl;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    app.run();
});