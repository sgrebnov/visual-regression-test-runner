"use strict";
var path = require("path");
function getDefault() {
    var config = {
        jasmine: {
            defaultTimeoutInterval: 30000,
            getReporter: function () {
                var JasmineConsoleReporter = require('jasmine-console-reporter');
                return new JasmineConsoleReporter({
                    colors: 2,
                    cleanStack: true,
                    verbosity: 4,
                    listStyle: 'indent',
                    activity: false //!helpers.isAppveyor()
                });
            }
        },
        webdriverio: {
            windowSize: {
                width: 1920,
                height: 1080
            }
        },
        webdrivercss: {
            screenshotRoot: "screenshots/originals",
            failedComparisonsRoot: "screenshots/differents",
            misMatchTolerance: 0,
            screenWidth: [1920],
            gmOptions: {
                appPath: require("graphics-magick-binaries").getGMBinariesPathForCurrentSystem()
            }
        },
        clone: function () { return _.cloneDeep(config); }
    };
    return config;
}
exports.getDefault = getDefault;
function readConfig(configPath) {
    configPath = path.resolve(configPath);
    var customConfig = _.cloneDeep(require(configPath).config);
    var config = _.defaultsDeep(customConfig, getDefault(), { rootDir: path.dirname(configPath) });
    if (_.isArray(config.capabilities) && config.capabilities.length > 0) {
        config.capabilities.forEach(function (x) { return x.getDefaultName = function () { return x.name || x.browserName; }; });
    }
    else {
        config.capabilities = [];
    }
    return config;
}
exports.readConfig = readConfig;
