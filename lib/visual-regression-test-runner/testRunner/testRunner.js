"use strict";
var _references_1 = require("../_references");
var WebdriverCSS = require("webdrivercss");
var WebdriverIO = require("webdriverio");
var path = require("path");
var url = require("url");
var fs = require("fs");
var jasmineTestRunner_1 = require("./jasmineTestRunner");
var testRunnerConfig = require("./testRunnerConfig");
var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
var webdriverIOEx_1 = require("../webDriver/webdriverIOEx");
var testRunner;
(function (testRunner) {
    var isImageUpdate = !!process.argv.filter(function (x) { return x && x.toLowerCase() === "--updateimages"; })[0];
    function getCurrentSpecImagePath() {
        return jasmineTestRunner_1.jasmineTestRunner.getCurrentSpecResult().fullName.replace(/ /, "/").replace(/[^a-z0-9 -/]/gi, "");
    }
    testRunner.getCurrentSpecImagePath = getCurrentSpecImagePath;
    function run(configPath) {
        var config = testRunnerConfig.readConfig(configPath);
        return runByConfig(config);
    }
    testRunner.run = run;
    function runByConfig(config) {
        if (config.webdrivercss && isImageUpdate) {
            rimraf.sync(config.webdrivercss.screenshotRoot);
            rimraf.sync(config.webdrivercss.failedComparisonsRoot);
        }
        var reporters = getReporters(config);
        return config.capabilities
            .reduce(function (previous, current, index) {
            return previous.then(function () { return runByCapabilities(config, index, reporters); });
        }, Q(function () { }));
    }
    function runByCapabilities(config, capabilitiesIndex, reporters) {
        var defer = Q.defer();
        return initWebdriverIO(config, config.capabilities[capabilitiesIndex])
            .then(function () {
            return browser.url(config.isStartPageLocalFile() ? "file:///" + config.startPage : config.startPage);
        })
            .then(function () {
            if (_.isArray(config.files)) {
                var files = _.flatten(config.files.map(function (v) {
                    if (url.parse(v) && url.parse(v).host) {
                        return v;
                    }
                    else {
                        if (config.isStartPageLocalFile()) {
                            var startPageDirName_1 = path.dirname(config.startPage);
                            return _references_1.helpers.getFilesByGlob(v, [], config.rootDir)
                                .map(function (x) { return path.relative(startPageDirName_1, x).replace(/\\/g, "/"); });
                        }
                    }
                })).filter(function (x) { return !!x; });
                return files.reduce(function (promise, file) {
                    return promise.then(function () {
                        switch (path.extname(file).toLowerCase()) {
                            case ".js": return browser.execute(function (src) {
                                var script = document.createElement("script");
                                script.src = src;
                                script.type = "text/javascript";
                                var head = document.getElementsByTagName("head")[0];
                                (head || document.body).appendChild(script);
                            }, file);
                            case ".css": return browser.execute(function (src) {
                                var link = document.createElement("link");
                                link.href = src;
                                link.type = "text/css";
                                link.rel = "stylesheet";
                                var head = document.getElementsByTagName("head")[0];
                                (head || document.body).appendChild(link);
                            }, file);
                            default: return Q(function () { });
                        }
                    });
                }, Q(function () { }))
                    .then(function () { return browser.executeAsync(function (done) { setTimeout(done, 0); }); });
            }
        })
            .then(function () {
            if (_.isArray(config.evalFiles)) {
                var files = _references_1.helpers.getFilesByGlob(config.evalFiles, [], config.rootDir);
                return files.reduce(function (promise, file) {
                    return promise.then(function () {
                        var src = fs.readFileSync(file, "utf8");
                        return browser.execute(function (code) { eval(code); }, src);
                    });
                }, Q(function () { }));
            }
        })
            .then(function () {
            if (_.isFunction(config.waitUntil)) {
                return browser.waitUntil(function () {
                    return browser.execute(config.waitUntil).then(function (result) { return !!result.value; });
                });
            }
        })
            .then(function () {
            jasmineTestRunner_1.jasmineTestRunner.init();
            jasmine.DEFAULT_TIMEOUT_INTERVAL = config.jasmine.defaultTimeoutInterval;
            addReporters(config, capabilitiesIndex, reporters);
        })
            .then(function () { return jasmineTestRunner_1.jasmineTestRunner.run(config.specs, config.exclude, config.rootDir); })
            .catch(function (ex) { return console.error(Chalk.red(ex)); })
            .fin(function () { return browser.endAll(); });
    }
    function getReporters(config) {
        var reporters = [];
        if (_.isFunction(config.jasmine.getReporter)) {
            reporters.push(config.jasmine.getReporter());
        }
        return reporters;
    }
    function addReporters(config, capabilitiesIndex, reporters) {
        var reporter = {
            jasmineStarted: function (value) {
                if (capabilitiesIndex !== 0) {
                    return;
                }
                value = _.cloneDeep(value);
                value.totalSpecsDefined *= config.capabilities.length;
                reporters.forEach(function (x) { return x.jasmineStarted(value); });
            },
            jasmineDone: function (value) {
                if (capabilitiesIndex === 0) {
                    reporters.mergedJasmineDoneResult = value;
                }
                else {
                    value.failedExpectations.forEach(reporters.mergedJasmineDoneResult.failedExpectations.push);
                }
                if (capabilitiesIndex !== config.capabilities.length - 1) {
                    return;
                }
                reporters.forEach(function (x) { return x.jasmineDone(reporters.mergedJasmineDoneResult); });
            },
            suiteStarted: function (value) {
                value = getSuiteResult(value);
                reporters.forEach(function (x) { return x.suiteStarted(value); });
            },
            suiteDone: function (value) {
                value = getSuiteResult(value);
                reporters.forEach(function (x) { return x.suiteDone(value); });
            },
            specStarted: function (value) {
                value = getSpecResult(value);
                reporters.forEach(function (x) { return x.specStarted(value); });
            },
            specDone: function (value) {
                value = getSpecResult(value);
                reporters.forEach(function (x) { return x.specDone(value); });
            }
        };
        jasmine.getEnv().addReporter(reporter);
        function getSpecResult(value) {
            value = _.cloneDeep(value);
            value.fullName = getPrefix() + value.fullName;
            value.id += getPrefix();
            return value;
        }
        function getSuiteResult(value) {
            value = _.cloneDeep(value);
            value.description = getPrefix() + value.description;
            value.id += getPrefix();
            return value;
        }
        function getPrefix() {
            return "[" + config.capabilities[capabilitiesIndex].getDefaultName() + "] ";
        }
    }
    function initWebdriverIO(config, currentCapabilities) {
        var timeout = config.jasmine.defaultTimeoutInterval;
        return Q.fcall(function () { return global.browser = WebdriverIO.remote({
            desiredCapabilities: {
                browserName: currentCapabilities.browserName
            },
            waitforTimeout: timeout
        }); })
            .then(function () { return initWebdriverCSS(config, currentCapabilities); })
            .then(function () { return webdriverIOEx_1.initWebdriverIOEx(browser); })
            .then(function () { return browser.init(); })
            .then(function () {
            if (config.webdriverio
                && config.webdriverio.windowSize
                && config.webdriverio.windowSize.width > 0
                && config.webdriverio.windowSize.height > 0) {
                return browser.windowHandleSize(config.webdriverio.windowSize);
            }
        })
            .then(function () { return browser
            .timeouts("script", timeout)
            .timeouts("page load", timeout)
            .timeouts("implicit", timeout)
            .timeoutsAsyncScript(timeout)
            .timeoutsImplicitWait(timeout); });
    }
    function initWebdriverCSS(config, currentCapabilities) {
        if (!config.webdrivercss) {
            return;
        }
        var screenshotRoot = path.join(config.webdrivercss.screenshotRoot, currentCapabilities.getDefaultName());
        var failedComparisonsRoot = path.join(config.webdrivercss.failedComparisonsRoot, currentCapabilities.getDefaultName());
        mkdirp.sync(screenshotRoot);
        mkdirp.sync(failedComparisonsRoot);
        WebdriverCSS.init(browser, _.extend(config.clone().webdrivercss, {
            screenshotRoot: screenshotRoot,
            failedComparisonsRoot: failedComparisonsRoot
        }));
    }
})(testRunner = exports.testRunner || (exports.testRunner = {}));