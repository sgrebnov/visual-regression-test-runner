"use strict";
var externals_1 = require("../externals");
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
            viewportSize: {
                width: 1900,
                height: 990
            }
        },
        webdrivercss: {
            screenshotRoot: "screenshots/originals",
            failedComparisonsRoot: "screenshots/differents",
            misMatchTolerance: 0,
            screenWidth: [1900],
            gmOptions: {
                appPath: require("graphics-magick-binaries").getGMBinariesPathForCurrentSystem()
            }
        },
        clone: function () { return externals_1._.cloneDeep(config); },
    };
    return config;
}
exports.getDefault = getDefault;
function readConfig(configPath) {
    if (!configPath) {
        throw new Error("Please specify a valid location of configuration file");
    }
    configPath = externals_1.Path.resolve(configPath);
    if (!externals_1.FS.existsSync(configPath)) {
        throw new Error("The config file does not exist on this path");
    }
    var config;
    try {
        config = require(configPath);
        if (!config) {
            throw new Error();
        }
    }
    catch (ex) {
        throw new Error("The config file has an invalid format");
    }
    return externals_1._.defaultsDeep(config, { rootDir: externals_1.Path.dirname(configPath) });
}
exports.readConfig = readConfig;
function applyDefaults(originalConfig) {
    var config = externals_1._.defaultsDeep(originalConfig, getDefault());
    config.webdrivercss.screenshotRoot = externals_1.Path.isAbsolute(config.webdrivercss.screenshotRoot)
        ? config.webdrivercss.screenshotRoot
        : externals_1.Path.join(config.rootDir, config.webdrivercss.screenshotRoot);
    config.webdrivercss.failedComparisonsRoot = externals_1.Path.isAbsolute(config.webdrivercss.failedComparisonsRoot)
        ? config.webdrivercss.failedComparisonsRoot
        : externals_1.Path.join(config.rootDir, config.webdrivercss.failedComparisonsRoot);
    if (externals_1._.isArray(config.capabilities) && config.capabilities.length > 0) {
        config.capabilities.forEach(function (x) { return x.getDefaultName = function () { return x.name || x.browserName; }; });
    }
    else {
        config.capabilities = [];
    }
    if (config.startPage) {
        if (externals_1.Url.parse(config.startPage) && externals_1.Url.parse(config.startPage).host) {
        }
        else {
            config.startPage = externals_1.Path.isAbsolute(config.startPage)
                ? config.startPage
                : externals_1.Path.join(config.rootDir, config.startPage);
        }
    }
    else {
        config.startPage = externals_1.Path.join(__dirname, "../../../resources/blank-page.html");
    }
    var isStartPageLocalFile = externals_1.FS.existsSync(config.startPage);
    config.isStartPageLocalFile = function () { return isStartPageLocalFile; };
    return config;
}
exports.applyDefaults = applyDefaults;
