"use strict";
var path = require("path");
var Launcher = require("webdriverio/build/lib/launcher");
var WDIOTestRunner = (function () {
    function WDIOTestRunner(configPath, options) {
        this.configPath = path.resolve(configPath);
        this.launcher = new Launcher(this.configPath, this.getConfigArgs(require(this.configPath).config));
    }
    WDIOTestRunner.prototype.run = function () {
        return this.launcher.run();
    };
    WDIOTestRunner.prototype.getConfigArgs = function (config) {
        var configArgs = {};
        if (config.plugins
            && config.plugins.webdrivercss
            && !(config.plugins.webdrivercss.gmOptions && config.plugins.webdrivercss.gmOptions.appPath)) {
            _.extend(configArgs, {
                plugins: {
                    webdrivercss: {
                        gmOptions: {
                            appPath: require("graphics-magick-binaries").getGMBinariesPathForCurrentSystem()
                        }
                    }
                }
            });
        }
        return configArgs;
    };
    return WDIOTestRunner;
}());
exports.WDIOTestRunner = WDIOTestRunner;
