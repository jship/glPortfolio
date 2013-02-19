ShipGL.DemoApp = function(canvasId, contextOptions)
{
    ShipGL.BaseApp.call(this, canvasId, contextOptions);

    this.modelOptions = $("#modelSelector")[0];
    this.models = [];
    this.curModel = null;
    this.prevModel = null;

    this.camera = null;
    
    this.projMatrix = mat4.create();

    this.activeLight = null;
    this.prevActiveLight = null;
    this.pointLight = null;
    this.dirLight = null;
    
    this.rotateLightButton = $("#rotateLight")[0];
};

ShipGL.DemoApp.prototype = Object.create(ShipGL.BaseApp.prototype);

ShipGL.DemoApp.prototype.initialize = function()
{
    this._initializeModels();
    this._initializeCamera();
    this._initializeLights();
};

ShipGL.DemoApp.prototype.update = function(elapsed)
{
    this.handleHeldKeys(elapsed);
    
    mat4.perspective(90, this.canvas.width / this.canvas.height,
                     0.01 * this.curModel.diagonal,
                     3 * this.curModel.diagonal, this.projMatrix);

    this.prevModel = this.curModel;
    this.curModel = this.models[this.modelOptions.selectedIndex];
    this.curModel.setProjection(this.projMatrix);
    this.curModel.setView(this.camera.viewMatrix);
    this.curModel.setViewDirection(this.camera.direction);

    if (this.prevModel != this.curModel)
    {
        this._initializeCamera();
        this._initializeLights();
    }

    if (this.rotateLightButton.checked)
    {
        if (!this.activeLight.isRotating)
            this.activeLight.startRotation(1, this.camera.up, this.curModel.center);

        this.activeLight.update(elapsed);
    }
    
    this.curModel.setLight(this.activeLight);
    this.curModel.setStandardDeviation(parseFloat(this._getCurrentStdDev()));
};

ShipGL.DemoApp.prototype.draw = function(elapsed)
{
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.curModel.draw(elapsed);
};

ShipGL.DemoApp.prototype.handleHeldKeys = function(elapsed)
{
    // 87 is 'w'.
    if (this.heldKeys[87])
        this.camera.moveForward();
    // 83 is 's'.
    if (this.heldKeys[83])
        this.camera.moveBackward();
    // 65 is 'a'.
    if (this.heldKeys[65])
        this.camera.moveLeft();
    // 68 is 'd'.
    if (this.heldKeys[68])
        this.camera.moveRight();
    // 72 is 'h'.
    if (this.heldKeys[72])
        this.camera.lookLeft();
    // 76 is 'l'.
    if (this.heldKeys[76])
        this.camera.lookRight();
    // 75 is 'k'.
    if (this.heldKeys[75])
        this.camera.moveUp();
    // 74 is 'j'.
    if (this.heldKeys[74])
        this.camera.moveDown();
};

ShipGL.DemoApp.prototype._initializeModels = function()
{
    var vShaderCode = ShipGL.FileLoader.loadLocal("lighting.vs") ||
                      ShipGL.FileLoader.loadHttp("lighting.vs");
    var fShaderCode = ShipGL.FileLoader.loadLocal("lighting.fs") ||
                      ShipGL.FileLoader.loadHttp("lighting.fs");

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

ShipGL.DemoApp.prototype._initializeLights = function()
{
    var intensity = vec3.createFrom(1, 1, 1);
    var scratchVec = vec3.create();

    vec3.set(this.curModel.center, scratchVec);
    var offset = vec3.create(ShipGL.Math.sphericalToCartesian(45, 45, this.curModel.diagonal));
    scratchVec[1] += offset[1];
    scratchVec[2] += offset[2];
    
    this.pointLight = new ShipGL.PointLight(intensity, scratchVec);

    vec3.set(this.curModel.center, scratchVec);
    scratchVec[1] += offset[1];
    scratchVec[2] += offset[2];

    vec3.subtract(this.curModel.center, scratchVec, scratchVec);
    vec3.normalize(scratchVec);

    this.dirLight = new ShipGL.DirectionalLight(intensity, scratchVec);

    this.activeLight = $("#pointLight")[0].checked ? this.pointLight : this.dirLight;
    this.prevActiveLight = this.activeLight;
};

ShipGL.DemoApp.prototype._getCurrentStdDev = function()
{
    return $("#stdDevRange").spinner("value");
};

$(document).ready(function() {
    $("select").combobox();
    
    $("#stdDevRange").spinner({ min: 0.0, max: 1.0, step: 0.05 });
    $("#stdDevRange").spinner("value", 0.2);
    $("#stdDevRange").attr("title", "Valid values are 0.0-1.0");
    $("#stdDevRange").tooltip({
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

    $("#lightType").buttonset().find('label').css('display', 'inline-block');
    $("#lightType input[type=radio]").change(function() {
        app.prevActiveLight = app.activeLight;
        app.activeLight = $("#pointLight")[0].checked ? app.pointLight : app.dirLight;
    
        if (app.prevActiveLight != app.activeLight)
            app.prevActiveLight.stopRotation();
    });

    $("#rotateLight").button();
    $("#rotateLight").change(function() {
        if (this.checked)
        {
            $(this).button("option", "label", "On");
            app.activeLight.startRotation(1, app.camera.up, app.curModel.center);
            return;
        }

        $(this).button("option", "label", "Off");
        app.activeLight.stopRotation();
    });

    $("#rotateLightWrapper").find('label').css('display', 'inline-block');

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
