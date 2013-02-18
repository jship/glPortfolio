ShipGL.DemoApp = function(canvasId, contextOptions)
{
    ShipGL.BaseApp.call(this, canvasId, contextOptions);

    this.xyzColor = vec3.create();
    this.colorTransform = mat3.create();
    this.rgbColor = vec3.create();

    this._scratchMat = mat3.create();
    this._scratchVec = vec3.create();
    
    this.colorSystemOptions = $("#colorSystemSelector")[0];
};

ShipGL.DemoApp.prototype = Object.create(ShipGL.BaseApp.prototype);

ShipGL.DemoApp.prototype.initialize = function()
{
    this._getCurrentInput();
};

ShipGL.DemoApp.prototype.update = function(elapsed)
{
    if (this._inputChanged())
    {
        this._spectrumToXYZ();
        this._XYZToRGB();
        this._updateBackgroundColor();
    }
    
    this._getCurrentInput();
};

ShipGL.DemoApp.prototype.draw = function(elapsed)
{
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
};

ShipGL.DemoApp.prototype._spectrumToXYZ = function()
{
    var i, j, lambda, N = 0, invN = 0, X = 0, Y = 0, Z = 0, sumXYZ = 0;
    var emittance, reflectance;

    for (lambda = 400, i = 4, j = 2; lambda < 700; lambda += 10, i += 2, j++)
    {
        emittance = bb_spectrum(this.curTemp, lambda);
        reflectance = colorChecker[this.curSquare][j];

        X += emittance * cie_colour_match[i][0] * reflectance;
        Y += emittance * cie_colour_match[i][1] * reflectance;
        Z += emittance * cie_colour_match[i][2] * reflectance;

        N += emittance * cie_colour_match[i][1];
    }
    
    invN = 1 / N;
    
    X *= invN;
    Y *= invN;
    Z *= invN;
    
    this.xyzColor[0] = X;
    this.xyzColor[1] = Y;
    this.xyzColor[2] = Z;
};

ShipGL.DemoApp.prototype._XYZToRGB = function()
{
    var i = 0, j = 0;

    var xWhite = this.curColorSystem.xWhite;
    var yWhite = this.curColorSystem.yWhite;
    var zWhite = 1 - xWhite - yWhite;

    var xRed = this.curColorSystem.xRed;
    var yRed = this.curColorSystem.yRed;
    var zRed = 1 - xRed - yRed;

    var xGreen = this.curColorSystem.xGreen;
    var yGreen = this.curColorSystem.yGreen;
    var zGreen = 1 - xGreen - yGreen;

    var xBlue = this.curColorSystem.xBlue;
    var yBlue = this.curColorSystem.yBlue;
    var zBlue = 1 - xBlue - yBlue;

    this.colorTransform[0] = xRed;
    this.colorTransform[1] = yRed;
    this.colorTransform[2] = zRed;
    this.colorTransform[3] = xGreen;
    this.colorTransform[4] = yGreen;
    this.colorTransform[5] = zGreen;
    this.colorTransform[6] = xBlue;
    this.colorTransform[7] = yBlue;
    this.colorTransform[8] = zBlue;

    this._scratchVec[0] = xWhite / yWhite;
    this._scratchVec[1] = 1;
    this._scratchVec[2] = zWhite / yWhite;

    mat3.inverse(this.colorTransform, this._scratchMat);
    mat3.multiplyVec3(this._scratchMat, this._scratchVec);

    for (i = 0, j = 0; i < 9; i += 3, j++)
    {
        this.colorTransform[i]     *= this._scratchVec[j];
        this.colorTransform[i + 1] *= this._scratchVec[j];
        this.colorTransform[i + 2] *= this._scratchVec[j];
    }

    mat3.inverse(this.colorTransform, this.colorTransform);
    mat3.multiplyVec3(this.colorTransform, this.xyzColor, this.rgbColor);

    constrain_rgb(this.rgbColor);
};

ShipGL.DemoApp.prototype._updateBackgroundColor = function()
{
    var r, g, b;

    gamma_correct_rgb(this.rgbColor, this.curColorSystem.gamma);

    r = this.rgbColor[0];
    g = this.rgbColor[1];
    b = this.rgbColor[2];

    this.gl.clearColor(r, g, b, 1.0);
};

ShipGL.DemoApp.prototype._getCurrentInput = function()
{
    this.prevColorSystem = this.curColorSystem;
    this.curColorSystem = this._getCurrentColorSystem();

    this.prevSquare = this.curSquare;
    this.curSquare = this._getCurrentSquare();

    this.prevTemp = this.curTemp;
    this.curTemp = this._getCurrentColorTemp();
};

ShipGL.DemoApp.prototype._getCurrentColorSystem = function()
{
    var i = this.colorSystemOptions.selectedIndex;
    return colorSystems[this.colorSystemOptions[i].value];
};

ShipGL.DemoApp.prototype._getCurrentSquare = function()
{
    return $("#squareRange").spinner("value") - 1;
};

ShipGL.DemoApp.prototype._getCurrentColorTemp = function()
{
    return $("#tempRange").spinner("value");
};

ShipGL.DemoApp.prototype._inputChanged = function()
{
    return (this.prevColorSystem != this.curColorSystem) ||
           (this.prevSquare != this.curSquare)           ||
           (this.prevTemp != this.curTemp);
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

    $("#squareRange").spinner({
        step: 1,
        spin: function(event, ui)
        {
            if (ui.value > 24)
            {
                $(this).spinner("value", 1);
                return false;
            }
            else if (ui.value < 1)
            {
                $(this).spinner("value", 24);
                return false;
            }
        }
    });

    $("#squareRange").spinner("value", 1);
    $("#squareRange").attr("title", "Valid values are 1-24.");
    $("#squareRange").tooltip({
        track: true,
        position: {
            my: "left+30 center",
            at: "right center",
            collision: "flipfit"
        }
    });

    $("#demoGuiTabs").tabs({ active: false, collapsible: true });

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
