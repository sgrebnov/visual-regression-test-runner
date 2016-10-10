"use strict";
var exports_1 = require("../exports");
var externals_1 = require("../externals");
var WebdriverCSS = require("webdrivercss");
var WebdriverIO = require("webdriverio");
var JasmineTestRunner_1 = require("./JasmineTestRunner");
var TestRunnerConfig = require("./TestRunnerConfig");
var seleniumServer_1 = require("../selenium/seleniumServer");
var TestRunner;
(function (TestRunner) {
    /**
     * Gets the string path by the full name of the current spec.
     *
     * @return Returns the string path.
     */
    function getCurrentSpecPath() {
        return JasmineTestRunner_1.JasmineTestRunner.getCurrentSpecResult().fullName.replace(/ /, "/").replace(/[^a-z0-9 -/]/gi, "");
    }
    TestRunner.getCurrentSpecPath = getCurrentSpecPath;
    /**
     * Runs tests using the path to the config file.
     *
     * @param configPath The path to config file.
     * @return Returns the promise.
     */
    function run(options) {
        return seleniumServer_1.SeleniumServer.isStarted()
            .then(runTests, function (ex) {
            if (options.autoRunSeleniumServer) {
                return seleniumServer_1.SeleniumServer.installRun()
                    .then(runTests)
                    .finally(function () { return seleniumServer_1.SeleniumServer.stop(); });
            }
            else {
                console.log(externals_1.Chalk.red("Selenium server is not running! - " + ex));
                throw ex;
            }
        });
        function runTests() {
            return new TestRunnerInternal(options).run();
        }
    }
    TestRunner.run = run;
    /**
     * Gets test runner options from command line arguments
     *
     * @return Returns test runner options.
     */
    function getCommandLineOptions() {
        var options = externals_1.commandLineArgs([
            { name: 'configPath', type: String, defaultOption: true },
            { name: 'autoRunSeleniumServer', type: Boolean },
            { name: 'updateBaselineImages', type: Boolean }
        ]);
        return options;
    }
    TestRunner.getCommandLineOptions = getCommandLineOptions;
    var TestRunnerInternal = (function () {
        function TestRunnerInternal(options) {
            if (!options) {
                throw new Error("The test runner options should be specified!");
            }
            this.options = options;
            this.config = TestRunnerConfig.applyDefaults(TestRunnerConfig.readConfig(this.options.configPath));
        }
        Object.defineProperty(TestRunnerInternal.prototype, "currentCapabilities", {
            get: function () {
                return this.config.capabilities[this.currentCapabilitiesIndex];
            },
            enumerable: true,
            configurable: true
        });
        TestRunnerInternal.prototype.run = function () {
            var _this = this;
            // sets reporters
            this.reporters = [];
            if (externals_1._.isFunction(this.config.jasmine.getReporter)) {
                this.reporters.push(this.config.jasmine.getReporter());
            }
            this.clearBaselineImages();
            return this.config.capabilities
                .reduce(function (previous, current, index) {
                _this.currentCapabilitiesIndex = index;
                return previous.then(function () { return _this.runByCapabilities(); });
            }, externals_1.Q(function () { }));
        };
        TestRunnerInternal.prototype.clearBaselineImages = function () {
            if (this.config.webdrivercss && this.options.updateBaselineImages) {
                externals_1.rimraf.sync(this.config.webdrivercss.screenshotRoot);
                externals_1.rimraf.sync(this.config.webdrivercss.failedComparisonsRoot);
            }
        };
        TestRunnerInternal.prototype.runByCapabilities = function () {
            var _this = this;
            return this.initWebdriverIO() // initializes webdriver.
                .then(function () {
                var startPage = _this.config.isStartPageLocalFile()
                    ? "file:///" + _this.config.startPage
                    : _this.config.startPage;
                return browser.url(startPage);
            })
                .then(function () { return _this.getWindowScreen().then(function (screen) {
                console.log(externals_1.Chalk.gray(("Screen resolution: " + screen.width + "x" + screen.height + ". ") +
                    ("Available size: " + screen.availWidth + "x" + screen.availHeight)));
            }); })
                .then(function () { return _this.getWindowSize().then(function (size) {
                console.log(externals_1.Chalk.gray(("Inner size: " + size.innerWidth + "x" + size.innerHeight + ". ") +
                    ("Outer size: " + size.outerWidth + "x" + size.outerHeight)));
            }); })
                .then(function () { return _this.addFileLinksOnTestPage(); }) // adds css/script links.
                .then(function () { return _this.executeFilesOnTestPage(); }) // executes scripts.
                .then(function () {
                if (externals_1._.isFunction(_this.config.waitUntil)) {
                    return browser.waitUntil(function () { return browser
                        .execute(_this.config.waitUntil)
                        .then(function (result) { return !!result.value; }); });
                }
            })
                .then(function () {
                JasmineTestRunner_1.JasmineTestRunner.init();
                jasmine.DEFAULT_TIMEOUT_INTERVAL = _this.config.jasmine.defaultTimeoutInterval;
                _this.addReporters();
            })
                .then(function () { return JasmineTestRunner_1.JasmineTestRunner.run(_this.config.specs, _this.config.exclude, _this.config.rootDir); }) // runs jasmine.
                .catch(function (ex) {
                console.log(externals_1.Chalk.red("Error: " + JSON.stringify(ex)));
                throw ex;
            })
                .finally(function () { return browser.endAll().catch(function (ex) {
                if (ex && ex["seleniumStack"]) {
                    var seleniumStack = ex["seleniumStack"];
                    if (seleniumStack
                        && seleniumStack["type"] === "UnknownError"
                        && seleniumStack["orgStatusMessage"] === "Can't obtain updateLastError method for class com.sun.jna.Native") {
                        return;
                    }
                }
                console.log(externals_1.Chalk.red("Error: " + JSON.stringify(ex)));
                throw ex;
            }); }); // closes the browser window.
        };
        TestRunnerInternal.prototype.getWindowScreen = function () {
            return browser
                .execute(function () {
                return JSON.stringify((function (obj) {
                    var ret = {};
                    for (var i in obj) {
                        ret[i] = obj[i];
                    }
                    return ret;
                })(screen));
            })
                .then(function (result) { return JSON.parse(result.value); });
        };
        TestRunnerInternal.prototype.getWindowSize = function () {
            return browser
                .execute(function () {
                return {
                    innerWidth: window.innerWidth,
                    innerHeight: window.innerHeight,
                    outerWidth: window.outerWidth,
                    outerHeight: window.outerHeight
                };
            })
                .then(function (result) { return result.value; });
        };
        TestRunnerInternal.prototype.addFileLinksOnTestPage = function () {
            var _this = this;
            if (!externals_1._.isArray(this.config.files)) {
                return;
            }
            var files = externals_1._.flatten(this.config.files.map(function (v) {
                if (externals_1.Url.parse(v) && externals_1.Url.parse(v).host) {
                    return v;
                }
                else {
                    if (_this.config.isStartPageLocalFile()) {
                        var startPageDirName_1 = externals_1.Path.dirname(_this.config.startPage);
                        return exports_1.Helpers.getFilesByGlob(v, [], _this.config.rootDir)
                            .map(function (x) { return externals_1.Path.relative(startPageDirName_1, x).replace(/\\/g, "/"); });
                    }
                }
            })).filter(function (x) { return !!x; });
            return files.reduce(function (promise, file) {
                return promise.then(function () {
                    switch (externals_1.Path.extname(file).toLowerCase()) {
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
                        default: return externals_1.Q(function () { });
                    }
                });
            }, externals_1.Q(function () { }))
                .then(function () { return browser.executeAsync(function (done) { setTimeout(done, 0); }); });
        };
        TestRunnerInternal.prototype.executeFilesOnTestPage = function () {
            if (!externals_1._.isArray(this.config.execFiles)) {
                return;
            }
            var files = exports_1.Helpers.getFilesByGlob(this.config.execFiles, [], this.config.rootDir);
            return files.reduce(function (promise, file) {
                return promise.then(function () {
                    var src = externals_1.FS.readFileSync(file, "utf8");
                    return browser.execute(function (code) { eval.call(window, code); }, src);
                });
            }, externals_1.Q(function () { }));
        };
        TestRunnerInternal.prototype.addReporters = function () {
            var _this = this;
            var getSpecResult = function (value) {
                value = externals_1._.cloneDeep(value);
                value.fullName = getPrefix() + value.fullName;
                value.id += getPrefix();
                return value;
            };
            var getSuiteResult = function (value) {
                value = externals_1._.cloneDeep(value);
                value.description = getPrefix() + value.description;
                value.id += getPrefix();
                return value;
            };
            var getPrefix = function () {
                return "[" + _this.currentCapabilities.getDefaultName() + "] ";
            };
            var reporter = {
                jasmineStarted: function (value) {
                    if (_this.currentCapabilitiesIndex !== 0) {
                        return;
                    }
                    value = externals_1._.cloneDeep(value);
                    value.totalSpecsDefined *= _this.config.capabilities.length;
                    _this.reporters.forEach(function (x) { return x.jasmineStarted(value); });
                },
                jasmineDone: function (value) {
                    if (_this.generalJasmineDoneResult) {
                        value.failedExpectations.forEach(_this.generalJasmineDoneResult.failedExpectations.push);
                    }
                    else {
                        _this.generalJasmineDoneResult = value;
                    }
                    if (_this.currentCapabilitiesIndex !== _this.config.capabilities.length - 1) {
                        return;
                    }
                    _this.reporters.forEach(function (x) { return x.jasmineDone(_this.generalJasmineDoneResult); });
                },
                suiteStarted: function (value) {
                    value = getSuiteResult(value);
                    _this.reporters.forEach(function (x) { return x.suiteStarted(value); });
                },
                suiteDone: function (value) {
                    value = getSuiteResult(value);
                    _this.reporters.forEach(function (x) { return x.suiteDone(value); });
                },
                specStarted: function (value) {
                    value = getSpecResult(value);
                    _this.reporters.forEach(function (x) { return x.specStarted(value); });
                },
                specDone: function (value) {
                    value = getSpecResult(value);
                    _this.reporters.forEach(function (x) { return x.specDone(value); });
                }
            };
            jasmine.getEnv().addReporter(reporter);
        };
        TestRunnerInternal.prototype.initWebdriverIO = function () {
            var _this = this;
            var timeout = this.config.jasmine.defaultTimeoutInterval;
            return externals_1.Q.fcall(function () { return global.browser = WebdriverIO.remote({
                desiredCapabilities: {
                    browserName: _this.currentCapabilities.browserName
                },
                waitforTimeout: timeout
            }); })
                .then(function () { return _this.initWebdriverCSS(); })
                .then(function () { return exports_1.initWebdriverIOEx(browser); }) // adds helper methods to the webdriverio client.
                .then(function () { return browser.init(); }) // initializes the webdriverio client.
                .then(function () {
                if (_this.config.webdriverio
                    && _this.config.webdriverio.viewportSize
                    && _this.config.webdriverio.viewportSize.width > 0
                    && _this.config.webdriverio.viewportSize.height > 0) {
                    return browser
                        .setViewportSize(_this.config.webdriverio.viewportSize, true)
                        .windowHandlePosition({ x: 0, y: 0 });
                }
            })
                .then(function () { return browser // sets a timeout.
                .timeouts("script", timeout)
                .timeouts("page load", timeout)
                .timeouts("implicit", timeout)
                .timeoutsAsyncScript(timeout)
                .timeoutsImplicitWait(timeout); });
        };
        TestRunnerInternal.prototype.initWebdriverCSS = function () {
            if (!this.config.webdrivercss) {
                return;
            }
            var screenshotRoot = externals_1.Path.join(this.config.webdrivercss.screenshotRoot, this.currentCapabilities.getDefaultName());
            var failedComparisonsRoot = externals_1.Path.join(this.config.webdrivercss.failedComparisonsRoot, this.currentCapabilities.getDefaultName());
            externals_1.mkdirp.sync(screenshotRoot);
            externals_1.mkdirp.sync(failedComparisonsRoot);
            WebdriverCSS.init(browser, externals_1._.extend(this.config.clone().webdrivercss, {
                screenshotRoot: screenshotRoot,
                failedComparisonsRoot: failedComparisonsRoot
            }));
        };
        return TestRunnerInternal;
    }());
})(TestRunner = exports.TestRunner || (exports.TestRunner = {}));
