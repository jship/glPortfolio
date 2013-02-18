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
    $("select").combobox();

    $("#tempRange").spinner({ min: 1000, max: 10000, step: 100 });
    $("#tempRange").spinner("value", 6800);
    $("#tempRange").attr("title", "Valid values are 1000-10000.");
    $("#tempRange").tooltip({
        track: true,
        position: {
            my: "left+30 center",
            at: "right center",
            collision: "flipfit"
        }
    });

    $("#helpBox").click(function() { $("#helpBox").hide("highlight"); });
    
    $("#demoGuiTabs").tabs({
        active: false,
        collapsible: true,
        beforeLoad: function(event, ui)
        {
            ui.jqXHR.fail(function()
            {
                var tab = $(ui.panel);
                tab.html('<div class="ui-widget">' +
                             '<div class="ui-state-error ui-corner-all" style="padding: 0 .7em;">' +
                                 '<p>' +
                                     '<span class="ui-icon ui-icon-alert" style="float: left; margin-right: .3em;"></span>' +
                                     '<strong>Error:</strong> AJAX could not load this content. ' +
                                     'GitHub might be having problems at this time.' +
                                 '</p>' +
                             '</div>' +
                         '</div>'
                 );
            });
        },
        load: function(event, ui)
        {
            var tab = $(ui.panel);
            tab.html('<pre class="language-clike"><code class="language-clike">' + tab.text() + '</code></pre>');

            var code = $("code", tab)[0];
            Prism.highlightElement(code, false);
        }
    });

    $("#tabControls").attr("title", "You can probably tell that I love vim!");
    $("#tabControls").tooltip({ track: true });

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
