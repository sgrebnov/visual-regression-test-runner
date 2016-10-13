import {Helpers, WebdriverIO, HttpServer} from "../exports";
import {_, Q, Path, FS, Globule, Url, mkdirp, rimraf, Chalk, commandLineArgs} from "../externals";
import * as WebdriverCSS from "webdrivercss";
import {JasmineTestRunner} from "./JasmineTestRunner";
import * as TestRunnerConfig from "./TestRunnerConfig";
import {SeleniumServer} from "../selenium/seleniumServer";
import Config = TestRunnerConfig.Config;
import InitTestMode = TestRunnerConfig.InitTestMode;
import ConfigCapabilities = TestRunnerConfig.ConfigCapabilities;

export module TestRunner {
    let currentestRunnerInternal: TestRunnerInternal;

    /**
     * Gets the current config.
     *
     * @return Returns the config.
     */
    export function getCurrentConfig() {
        return currentestRunnerInternal && _.cloneDeep(currentestRunnerInternal.config);
    }

    /**
     * Gets the string path by the full name of the current spec.
     *
     * @return Returns the string path.
     */
    export function getCurrentSpecPath(): string {
        if(!jasmine || !jasmine.currentSpec || !jasmine.currentSuite) {
            return null;
        }

        let currentSuite = jasmine.currentSuite;
        let suites: jasmine.Suite[] = [];
        while(currentSuite && currentSuite !== jasmine.getEnv().topSuite()) {
            suites.push(currentSuite);
            currentSuite = currentSuite.parentSuite;
        }

        let descriptions = suites.reverse().map(x => x.description);
        descriptions.push(jasmine.currentSpec.description);

        return descriptions.map(x => x.replace(/[^a-z0-9 -/]/gi, "")).join("/");
    }

    /**
     * Runs tests using the path to the config file.
     *
     * @param configPath The path to config file.
     * @return Returns the promise.
     */
    export function run(options: TestRunnerOptions): Promise<any> {
        SeleniumServer.setCurrentOptions(options.seleniumServerOptions);
        return SeleniumServer.isStarted()
            .then(runTests, err => {
                if(options.autoRunSeleniumServer) {
                    return SeleniumServer.installStart()
                        .then(runTests, logError)
                        .finally(() => SeleniumServer.stop());
                } else {
                    console.log(Chalk.red("Selenium server is not running!"));
                    throw err;
                }
            })
            .catch(logError);

        function runTests() {
            currentestRunnerInternal = new TestRunnerInternal(options);
            return currentestRunnerInternal.run();
        }
    }

    /**
     * Gets test runner options from command line arguments
     *
     * @return Returns test runner options.
     */
    export function getCommandLineOptions(): TestRunnerOptions {
         let options = commandLineArgs([
                 { name: 'configPath', type: String, defaultOption: true },
                 { name: 'autoRunSeleniumServer', type: Boolean },
                 { name: 'updateBaselineImages', type: Boolean }
             ]);
        return options;
    }

    export interface TestRunnerOptions {
        configPath: string;
        autoRunSeleniumServer?: boolean;
        updateBaselineImages?: boolean;
        seleniumServerOptions?: SeleniumServer.Options;
    }

    export function logError(error): any {
        if(error instanceof Error) {
            console.log("\n" + Chalk.red("Error: " + JSON.stringify(error.message)));
            console.log(error.stack);
        } else {
            console.log("\n" + Chalk.red("Error: " + JSON.stringify(error)));
        }

        throw error;
    }

    class TestRunnerInternal {
        public config: Config;
        private static DefaultStartPagePath = Path.join(__dirname, "../../../resources/blank-page.html");
        private options: TestRunnerOptions;
        private webdriverClient: WebdriverIO.Client<void>;
        private currentCapabilitiesIndex: number;
        private get currentCapabilities(): ConfigCapabilities {
            return this.config.capabilities[this.currentCapabilitiesIndex];
        }

        constructor(options: TestRunnerOptions) {
            if(!options) {
                throw new Error("The test runner options should be specified!");
            }

            this.options = options;
            this.config = TestRunnerConfig.applyDefaults(TestRunnerConfig.readConfig(this.options.configPath));
        }

        public run() {
            return Q()
                .then(() => HttpServer.start())
                .then(() => {
                    this.clearBaselineImages();
                    this.initJasmine();
                    let files = Helpers.getFilesByGlob(this.config.specs, this.config.rootDir);
                    JasmineTestRunner.loadRunnables(files,
                        this.config.capabilities,
                        x => `[${x.getDefaultName()}]`,
                        x => this.initTestsByCapabilities(x));
                })
                .then(() => JasmineTestRunner.execute())
                .finally(() => HttpServer.stop());
        }

        private clearBaselineImages() {
            if(this.config.webdrivercss && this.options.updateBaselineImages) {
                rimraf.sync(this.config.webdrivercss.screenshotRoot);
                rimraf.sync(this.config.webdrivercss.failedComparisonsRoot);
            }
        }

        private initJasmine() {
            JasmineTestRunner.init();
            jasmine.DEFAULT_TIMEOUT_INTERVAL = this.config.jasmine.defaultTimeoutInterval;
            if(_.isFunction(this.config.jasmine.getReporter)) {
                 jasmine.getEnv().addReporter(this.config.jasmine.getReporter());
            }

            jasmine.initTestWDClient = (url) => {
                return this.navigateSetupWebDriverIO(url)
                    .catch(ex => {
                        this.failCurrentSuite(ex);
                        logError(ex);
                    });
            };
            jasmine.printConsoleLogsWDClient = () => {
                return this.webdriverClient.getConsoleLogs(true)
                    .then((logs) => {
                        if(_.isArray(logs)) {
                            logs.forEach(printLog);
                        }
                    });
                function printLog(log: WebdriverIO.ConsoleLog) {
                    let color: Chalk.ChalkChain = {
                        log: Chalk.white,
                        warn: Chalk.yellow,
                        error: Chalk.red
                    }[log.type];
                    console[log.type]("\n" + color(`[CLIENT-CONSOLE-${log.type.toUpperCase()}] ${log.message}`));
                }
            };
        }

        private initTestsByCapabilities(capabilities: TestRunnerConfig.ConfigCapabilities) {
            jasmine.currentBrowser = <any>capabilities.browserName;
            beforeAll(() => {
                jasmine.currentBrowser = <any>capabilities.browserName;
                this.currentCapabilitiesIndex = this.config.capabilities.indexOf(capabilities);

                return this.initWebdriverIO() // initializes webdriver.
                    .then(() => jasmine.events.emit("WDClientChanged", jasmine.WDClient = this.webdriverClient))
                    .catch(ex => {
                        this.failCurrentSuite(ex);
                        logError(ex);
                    });
            }, jasmine.MAX_TIMEOUT);

            switch(this.config.initTestMode) {
                case InitTestMode.BeforeAll:
                    beforeAll(() => this.navigateSetupWebDriverIO());
                    break;
                case InitTestMode.BeforeEach:
                    beforeEach(() => this.navigateSetupWebDriverIO());
                    break;
            }

            afterEach(() => {
                return jasmine.printConsoleLogsWDClient();
            });

            afterAll(() => {
                return this.closeWebDriver();
            }, jasmine.MAX_TIMEOUT);
        }

        private failCurrentSuite(error) {
            jasmine.currentSuite.getAllChildren().forEach(x =>
                x.pend("Disabled due to an error during the webdriver client initialization"));
            jasmine.currentSuite.getResult().onException(error);
        }

        private navigateSetupWebDriverIO(url?: string) {
            url = url || this.config.startPage;
            if(url) {
                if(Url.parse(url) && Url.parse(url).host) {
                } else {
                    url = Path.isAbsolute(url) ? url : Path.join(this.config.rootDir, url);
                }
            } else {
                url = TestRunnerInternal.DefaultStartPagePath;
            }

            return this.webdriverClient
                .then(() => { // opens the start page.
                    let startPage = FS.existsSync(url) ? HttpServer.getUrl(url) : url;
                    return this.webdriverClient.url(startPage);
                })
                .initConsoleLogReader()
                .then(() => this.printBrowserInfo())
                .then(() => this.addFileLinksOnTestPage(url)) // adds css/script links.
                .then(() => { // executes scripts.
                    if(_.isArray(this.config.execFiles)) {
                        let files = Helpers.getFilesByGlob(this.config.execFiles, this.config.rootDir);
                        return this.webdriverClient.executeFiles(files);
                    }
                 })
                .then(() => { // waits until the page is not ready for testing.
                    if(_.isFunction(this.config.waitUntil)) {
                        return this.webdriverClient.waitUntil(() => this.webdriverClient
                                .execute(this.config.waitUntil)
                                .then(result => !!result.value));
                    }
                })
                .catch(logError);
        }

        private closeWebDriver() {
            return this.webdriverClient
                .finally(() => this.webdriverClient.end() // closes the browser window.
                    .catch(error => {
                        if(error && error["seleniumStack"]) { //supresses an unknown error on appveyor
                            let seleniumStack = error["seleniumStack"];
                            if(seleniumStack
                                && seleniumStack["type"] === "UnknownError"
                                && seleniumStack["orgStatusMessage"] === "Can't obtain updateLastError method for class com.sun.jna.Native") {
                                return;
                            }
                        }
                        if(error && error.toString() === "Error: Could not initialize class org.openqa.selenium.os.Kernel32") {
                            console.log("\n" + Chalk.red(error));
                            return;
                        }

                        throw error;
                    }))
                .catch(logError);
        }

        private printBrowserInfo() {
            return this.webdriverClient
                .then(() => console.log("\n" + Chalk.gray("=========")))
                .then(() => getWindowScreen(this.webdriverClient).then(screen => {
                    console.log(Chalk.gray(
                        `Screen resolution: ${screen.width}x${screen.height}. ` +
                        `Available size: ${screen.availWidth}x${screen.availHeight}`));
                }))
                .then(() => getWindowSize(this.webdriverClient).then(size => {
                    console.log(Chalk.gray(
                        `Inner size: ${size.innerWidth}x${size.innerHeight}. ` +
                        `Outer size: ${size.outerWidth}x${size.outerHeight}`));
                }))
                .then(() => console.log(Chalk.gray("=========")));

            function getWindowScreen(client: WebdriverIO.Client<any>) {
                return client
                    .execute(function(){ 
                        return JSON.stringify((function(obj) {
                            var ret = {};
                            for (var i in obj) {
                                ret[i] = obj[i];
                            }
                            return ret;
                        })(screen))})
                    .then(result => <Screen>JSON.parse(result.value));
            }

            function getWindowSize(client: WebdriverIO.Client<any>) {
                return client
                    .execute(function(){
                        return { 
                            innerWidth: window.innerWidth,
                            innerHeight: window.innerHeight,
                            outerWidth: window.outerWidth,
                            outerHeight: window.outerHeight
                         };
                    })
                    .then(result => <{
                        innerWidth: number,
                        innerHeight: number,
                        outerWidth: number,
                        outerHeight: number
                    }>result.value);
            }
        }

        private addFileLinksOnTestPage(url: string) {
            if(!_.isArray(this.config.files)) {
                return;
            }

            let isFile = FS.existsSync(url);
            let files = _.flatten(this.config.files.map(v => {
                if(Url.parse(v) && Url.parse(v).host) {
                    return v;
                } else {
                    if(isFile) {
                        let startPageDirName = Path.dirname(url);
                        return Helpers.getFilesByGlob(v, this.config.rootDir).map(x => HttpServer.getUrl(x));
                    }
                }
            })).filter(x => !!x);

            return this.webdriverClient.executeAsync(function(files: string[], done: () => void) {
                (function addFileLinksAsync(index: number) {
                    setTimeout(function() {
                        if(files[index]) {
                            addFileLink(files[index], function() {
                                addFileLinksAsync(index + 1);
                            });
                        } else {
                            done();
                        }
                    }, 0);
                })(0);
                function addFileLink(src: string, onload: () => any) {
                    switch(src && /[^.]+$/.exec(src)[0]) {
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
        }

        private initWebdriverIO() {
            let timeout = this.config.jasmine.defaultTimeoutInterval;
            return Q.fcall(() => this.webdriverClient = WebdriverIO.remote({ // sets the webrdriverio client as a global variable.
                    desiredCapabilities: this.getDesiredCapabilities(this.currentCapabilities),
                    waitforTimeout: timeout,
                    host: SeleniumServer.getCurrentHost(),
                    port: SeleniumServer.getCurrentPort()
                }))
                .then(() => this.initWebdriverCSS())
                .then(() => this.webdriverClient.init()) // initializes the webdriverio client.
                .then(() => { // sets a window size.
                    if(this.config.webdriverio
                        && this.config.webdriverio.viewportSize
                        && this.config.webdriverio.viewportSize.width > 0
                        && this.config.webdriverio.viewportSize.height > 0) {
                        return this.webdriverClient
                            .setViewportSize(this.config.webdriverio.viewportSize, true)
                            .windowHandlePosition({ x: 0, y: 0 });
                    }
                })
                .then(() => this.webdriverClient // sets a timeout.
                    .timeouts("script", timeout)
                    .timeouts("page load", timeout)
                    .timeouts("implicit", timeout)
                    .timeoutsAsyncScript(timeout)
                    .timeoutsImplicitWait(timeout)
                );
        }

        private getDesiredCapabilities(capabilities: ConfigCapabilities) {
            capabilities = _.cloneDeep(this.currentCapabilities);
            if(capabilities.browserName === <any>Browser.chromium) {
                if(!(<any>capabilities).chromeOptions
                    || !(<any>capabilities).chromeOptions.binary
                    || !FS.existsSync((<any>capabilities).chromeOptions.binary)) {
                    throw new Error("Missing chromium binary path");
                }

                capabilities.browserName = <any>Browser.chrome;
            }

            delete capabilities.getDefaultName;
            delete capabilities.name;
            return capabilities;
        }

        private initWebdriverCSS() {
            if(!this.config.webdrivercss) {
                return;
            }

            let screenshotRoot = Path.join(this.config.webdrivercss.screenshotRoot);
            let failedComparisonsRoot = Path.join(this.config.webdrivercss.failedComparisonsRoot);

            mkdirp.sync(screenshotRoot);
            mkdirp.sync(failedComparisonsRoot);

            WebdriverCSS.init(this.webdriverClient, _.extend(this.config.clone().webdrivercss, {
                screenshotRoot: screenshotRoot,
                failedComparisonsRoot: failedComparisonsRoot
            }));
        }
    }
}