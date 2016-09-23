"use strict";
var path = require("path");
var fs = require("fs");
var url = require("url");
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
    setUpConfig(config);
    return config;
}
exports.readConfig = readConfig;
function setUpConfig(config) {
    config.webdrivercss.screenshotRoot = path.isAbsolute(config.webdrivercss.screenshotRoot)
        ? config.webdrivercss.screenshotRoot
        : path.join(config.rootDir, config.webdrivercss.screenshotRoot);
    config.webdrivercss.failedComparisonsRoot = path.isAbsolute(config.webdrivercss.failedComparisonsRoot)
        ? config.webdrivercss.failedComparisonsRoot
        : path.join(config.rootDir, config.webdrivercss.failedComparisonsRoot);
    if (_.isArray(config.capabilities) && config.capabilities.length > 0) {
        config.capabilities.forEach(function (x) { return x.getDefaultName = function () { return x.name || x.browserName; }; });
    }
    else {
        config.capabilities = [];
    }
    if (config.startPage) {
        if (url.parse(config.startPage) && url.parse(config.startPage).host) {
        }
        else {
            config.startPage = path.isAbsolute(config.startPage)
                ? config.startPage
                : path.join(config.rootDir, config.startPage);
        }
    }
    else {
        config.startPage = path.join(__dirname, "../../../resources/blank-page.html");
    }
    var isStartPageLocalFile = fs.existsSync(config.startPage);
    config.isStartPageLocalFile = function () { return isStartPageLocalFile; };
}
