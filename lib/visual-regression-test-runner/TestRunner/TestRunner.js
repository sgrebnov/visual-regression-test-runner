"use strict";
var exports_1 = require("../exports");
var externals_1 = require("../externals");
var WebdriverCSS = require("webdrivercss");
var JasmineTestRunner_1 = require("./JasmineTestRunner");
var TestRunnerConfig = require("./TestRunnerConfig");
var seleniumServer_1 = require("../selenium/seleniumServer");
var InitTestMode = TestRunnerConfig.InitTestMode;
var TestRunner;
(function (TestRunner) {
    var currentestRunnerInternal;
    /**
     * Gets the current config.
     *
     * @return Returns the config.
     */
    function getCurrentConfig() {
        return currentestRunnerInternal && externals_1._.cloneDeep(currentestRunnerInternal.config);
    }
    TestRunner.getCurrentConfig = getCurrentConfig;
    /**
     * Gets the string path by the full name of the current spec.
     *
     * @return Returns the string path.
     */
    function getCurrentSpecPath() {
        if (!jasmine || !jasmine.currentSpec || !jasmine.currentSuite) {
            return null;
        }
        var currentSuite = jasmine.currentSuite;
        var suites = [];
        while (currentSuite && currentSuite !== jasmine.getEnv().topSuite()) {
            suites.push(currentSuite);
            currentSuite = currentSuite.parentSuite;
        }
        var descriptions = suites.reverse().map(function (x) { return x.description; });
        descriptions.push(jasmine.currentSpec.description);
        return descriptions.map(function (x) { return x.replace(/[^a-z0-9 -/]/gi, ""); }).join("/");
    }
    TestRunner.getCurrentSpecPath = getCurrentSpecPath;
    /**
     * Runs tests using the path to the config file.
     *
     * @param configPath The path to config file.
     * @return Returns the promise.
     */
    function run(options) {
        seleniumServer_1.SeleniumServer.setCurrentOptions(options.seleniumServerOptions);
        return seleniumServer_1.SeleniumServer.isStarted()
            .then(runTests, function (err) {
            if (options.autoRunSeleniumServer) {
                return seleniumServer_1.SeleniumServer.installStart()
                    .then(runTests, logError)
                    .finally(function () { return seleniumServer_1.SeleniumServer.stop(); });
            }
            else {
                console.log(externals_1.Chalk.red("Selenium server is not running!"));
                throw err;
            }
        })
            .catch(logError);
        function runTests() {
            currentestRunnerInternal = new TestRunnerInternal(options);
            return currentestRunnerInternal.run();
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
    function logError(error) {
        if (error instanceof Error) {
            console.log("\n" + externals_1.Chalk.red("Error: " + JSON.stringify(error.message)));
            console.log(error.stack);
        }
        else {
            console.log("\n" + externals_1.Chalk.red("Error: " + JSON.stringify(error)));
        }
        throw error;
    }
    TestRunner.logError = logError;
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
            return externals_1.Q()
                .then(function () { return exports_1.HttpServer.start(); })
                .then(function () {
                _this.clearBaselineImages();
                _this.initJasmine();
                var files = exports_1.Helpers.getFilesByGlob(_this.config.specs, _this.config.rootDir);
                JasmineTestRunner_1.JasmineTestRunner.loadRunnables(files, _this.config.capabilities, function (x) { return ("[" + x.getDefaultName() + "]"); }, function (x) { return _this.initTestsByCapabilities(x); });
            })
                .then(function () { return JasmineTestRunner_1.JasmineTestRunner.execute(); })
                .finally(function () { return exports_1.HttpServer.stop(); });
        };
        TestRunnerInternal.prototype.clearBaselineImages = function () {
            if (this.config.webdrivercss && this.options.updateBaselineImages) {
                externals_1.rimraf.sync(this.config.webdrivercss.screenshotRoot);
                externals_1.rimraf.sync(this.config.webdrivercss.failedComparisonsRoot);
            }
        };
        TestRunnerInternal.prototype.initJasmine = function () {
            var _this = this;
            JasmineTestRunner_1.JasmineTestRunner.init();
            jasmine.DEFAULT_TIMEOUT_INTERVAL = this.config.jasmine.defaultTimeoutInterval;
            if (externals_1._.isFunction(this.config.jasmine.getReporter)) {
                jasmine.getEnv().addReporter(this.config.jasmine.getReporter());
            }
            jasmine.initTestWDClient = function (url) {
                return _this.navigateSetupWebDriverIO(url)
                    .catch(function (ex) {
                    _this.failCurrentSuite(ex);
                    logError(ex);
                });
            };
            jasmine.printConsoleLogsWDClient = function () {
                return _this.webdriverClient.getConsoleLogs(true)
                    .then(function (logs) {
                    if (externals_1._.isArray(logs)) {
                        logs.forEach(printLog);
                    }
                });
                function printLog(log) {
                    var color = {
                        log: externals_1.Chalk.white,
                        warn: externals_1.Chalk.yellow,
                        error: externals_1.Chalk.red
                    }[log.type];
                    console[log.type]("\n" + color("[CLIENT-CONSOLE-" + log.type.toUpperCase() + "] " + log.message));
                }
            };
        };
        TestRunnerInternal.prototype.initTestsByCapabilities = function (capabilities) {
            var _this = this;
            jasmine.currentBrowser = capabilities.browserName;
            beforeAll(function () {
                jasmine.currentBrowser = capabilities.browserName;
                _this.currentCapabilitiesIndex = _this.config.capabilities.indexOf(capabilities);
                return _this.initWebdriverIO() // initializes webdriver.
                    .then(function () { return jasmine.events.emit("WDClientChanged", jasmine.WDClient = _this.webdriverClient); })
                    .catch(function (ex) {
                    _this.failCurrentSuite(ex);
                    logError(ex);
                });
            }, jasmine.MAX_TIMEOUT);
            switch (this.config.initTestMode) {
                case InitTestMode.BeforeAll:
                    beforeAll(function () { return _this.navigateSetupWebDriverIO(); });
                    break;
                case InitTestMode.BeforeEach:
                    beforeEach(function () { return _this.navigateSetupWebDriverIO(); });
                    break;
            }
            afterEach(function () {
                return jasmine.printConsoleLogsWDClient();
            });
            afterAll(function () {
                return _this.closeWebDriver();
            }, jasmine.MAX_TIMEOUT);
        };
        TestRunnerInternal.prototype.failCurrentSuite = function (error) {
            jasmine.currentSuite.getAllChildren().forEach(function (x) {
                return x.pend("Disabled due to an error during the webdriver client initialization");
            });
            jasmine.currentSuite.getResult().onException(error);
        };
        TestRunnerInternal.prototype.navigateSetupWebDriverIO = function (url) {
            var _this = this;
            url = url || this.config.startPage;
            if (url) {
                if (externals_1.Url.parse(url) && externals_1.Url.parse(url).host) {
                }
                else {
                    url = externals_1.Path.isAbsolute(url) ? url : externals_1.Path.join(this.config.rootDir, url);
                }
            }
            else {
                url = TestRunnerInternal.DefaultStartPagePath;
            }
            return this.webdriverClient
                .then(function () {
                var startPage = externals_1.FS.existsSync(url) ? exports_1.HttpServer.getUrl(url) : url;
                return _this.webdriverClient.url(startPage);
            })
                .initConsoleLogReader()
                .then(function () { return _this.printBrowserInfo(); })
                .then(function () { return _this.addFileLinksOnTestPage(url); }) // adds css/script links.
                .then(function () {
                if (externals_1._.isArray(_this.config.execFiles)) {
                    var files = exports_1.Helpers.getFilesByGlob(_this.config.execFiles, _this.config.rootDir);
                    return _this.webdriverClient.executeFiles(files);
                }
            })
                .then(function () {
                if (externals_1._.isFunction(_this.config.waitUntil)) {
                    return _this.webdriverClient.waitUntil(function () { return _this.webdriverClient
                        .execute(_this.config.waitUntil)
                        .then(function (result) { return !!result.value; }); });
                }
            })
                .catch(logError);
        };
        TestRunnerInternal.prototype.closeWebDriver = function () {
            var _this = this;
            return this.webdriverClient
                .finally(function () { return _this.webdriverClient.end() // closes the browser window.
                .catch(function (error) {
                if (error && error["seleniumStack"]) {
                    var seleniumStack = error["seleniumStack"];
                    if (seleniumStack
                        && seleniumStack["type"] === "UnknownError"
                        && seleniumStack["orgStatusMessage"] === "Can't obtain updateLastError method for class com.sun.jna.Native") {
                        return;
                    }
                }
                if (error && error.toString() === "Error: Could not initialize class org.openqa.selenium.os.Kernel32") {
                    console.log("\n" + externals_1.Chalk.red(error));
                    return;
                }
                throw error;
            }); })
                .catch(logError);
        };
        TestRunnerInternal.prototype.printBrowserInfo = function () {
            var _this = this;
            return this.webdriverClient
                .then(function () { return console.log("\n" + externals_1.Chalk.gray("=========")); })
                .then(function () { return getWindowScreen(_this.webdriverClient).then(function (screen) {
                console.log(externals_1.Chalk.gray(("Screen resolution: " + screen.width + "x" + screen.height + ". ") +
                    ("Available size: " + screen.availWidth + "x" + screen.availHeight)));
            }); })
                .then(function () { return getWindowSize(_this.webdriverClient).then(function (size) {
                console.log(externals_1.Chalk.gray(("Inner size: " + size.innerWidth + "x" + size.innerHeight + ". ") +
                    ("Outer size: " + size.outerWidth + "x" + size.outerHeight)));
            }); })
                .then(function () { return console.log(externals_1.Chalk.gray("=========")); });
            function getWindowScreen(client) {
                return client
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
            }
            function getWindowSize(client) {
                return client
                    .execute(function () {
                    return {
                        innerWidth: window.innerWidth,
                        innerHeight: window.innerHeight,
                        outerWidth: window.outerWidth,
                        outerHeight: window.outerHeight
                    };
                })
                    .then(function (result) { return result.value; });
            }
        };
        TestRunnerInternal.prototype.addFileLinksOnTestPage = function (url) {
            var _this = this;
            if (!externals_1._.isArray(this.config.files)) {
                return;
            }
            var isFile = externals_1.FS.existsSync(url);
            var files = externals_1._.flatten(this.config.files.map(function (v) {
                if (externals_1.Url.parse(v) && externals_1.Url.parse(v).host) {
                    return v;
                }
                else {
                    if (isFile) {
                        var startPageDirName = externals_1.Path.dirname(url);
                        return exports_1.Helpers.getFilesByGlob(v, _this.config.rootDir).map(function (x) { return exports_1.HttpServer.getUrl(x); });
                    }
                }
            })).filter(function (x) { return !!x; });
            return this.webdriverClient.executeAsync(function (files, done) {
                (function addFileLinksAsync(index) {
                    setTimeout(function () {
                        if (files[index]) {
                            addFileLink(files[index], function () {
                                addFileLinksAsync(index + 1);
                            });
                        }
                        else {
                            done();
                        }
                    }, 0);
                })(0);
                function addFileLink(src, onload) {
                    switch (src && /[^.]+$/.exec(src)[0]) {
                        case "js":
                            var script = document.createElement("script");
                            script.onload = onload;
                            script.onerror = onload;
                            script.src = src;
                            script.type = "text/javascript";
                            var head = document.getElementsByTagName("head")[0];
                            (head || document.body || document).appendChild(script);
                            break;
                        case "css":
                            var link = document.createElement("link");
                            link.href = src;
                            link.type = "text/css";
                            link.rel = "stylesheet";
                            var head = document.getElementsByTagName("head")[0];
                            (head || document.body || document).appendChild(link);
                            onload();
                            break;
                    }
                }
            }, files);
        };
        TestRunnerInternal.prototype.initWebdriverIO = function () {
            var _this = this;
            var timeout = this.config.jasmine.defaultTimeoutInterval;
            return externals_1.Q.fcall(function () { return _this.webdriverClient = exports_1.WebdriverIO.remote({
                desiredCapabilities: _this.getDesiredCapabilities(_this.currentCapabilities),
                waitforTimeout: timeout,
                host: seleniumServer_1.SeleniumServer.getCurrentHost(),
                port: seleniumServer_1.SeleniumServer.getCurrentPort()
            }); })
                .then(function () { return _this.initWebdriverCSS(); })
                .then(function () { return _this.webdriverClient.init(); }) // initializes the webdriverio client.
                .then(function () {
                if (_this.config.webdriverio
                    && _this.config.webdriverio.viewportSize
                    && _this.config.webdriverio.viewportSize.width > 0
                    && _this.config.webdriverio.viewportSize.height > 0) {
                    return _this.webdriverClient
                        .setViewportSize(_this.config.webdriverio.viewportSize, true)
                        .windowHandlePosition({ x: 0, y: 0 });
                }
            })
                .then(function () { return _this.webdriverClient // sets a timeout.
                .timeouts("script", timeout)
                .timeouts("page load", timeout)
                .timeouts("implicit", timeout)
                .timeoutsAsyncScript(timeout)
                .timeoutsImplicitWait(timeout); });
        };
        TestRunnerInternal.prototype.getDesiredCapabilities = function (capabilities) {
            capabilities = externals_1._.cloneDeep(this.currentCapabilities);
            if (capabilities.browserName === Browser.chromium) {
                if (!capabilities.chromeOptions
                    || !capabilities.chromeOptions.binary
                    || !externals_1.FS.existsSync(capabilities.chromeOptions.binary)) {
                    throw new Error("Missing chromium binary path");
                }
                capabilities.browserName = Browser.chrome;
            }
            delete capabilities.getDefaultName;
            delete capabilities.name;
            return capabilities;
        };
        TestRunnerInternal.prototype.initWebdriverCSS = function () {
            if (!this.config.webdrivercss) {
                return;
            }
            var screenshotRoot = externals_1.Path.join(this.config.webdrivercss.screenshotRoot);
            var failedComparisonsRoot = externals_1.Path.join(this.config.webdrivercss.failedComparisonsRoot);
            externals_1.mkdirp.sync(screenshotRoot);
            externals_1.mkdirp.sync(failedComparisonsRoot);
            WebdriverCSS.init(this.webdriverClient, externals_1._.extend(this.config.clone().webdrivercss, {
                screenshotRoot: screenshotRoot,
                failedComparisonsRoot: failedComparisonsRoot
            }));
        };
        TestRunnerInternal.DefaultStartPagePath = externals_1.Path.join(__dirname, "../../../resources/blank-page.html");
        return TestRunnerInternal;
    }());
})(TestRunner = exports.TestRunner || (exports.TestRunner = {}));
