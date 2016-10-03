import {Helpers, initWebdriverIOEx} from "../exports";
import {_, Q, Path, FS, Globule, Url, mkdirp, rimraf, Chalk, commandLineArgs} from "../externals";
import * as WebdriverCSS from "webdrivercss";
import * as WebdriverIO from "webdriverio";
import {JasmineTestRunner} from "./JasmineTestRunner";
import * as TestRunnerConfig from "./TestRunnerConfig";
import {SeleniumServer} from "../selenium/seleniumServer";
import Config = TestRunnerConfig.Config;
import ConfigCapabilities = TestRunnerConfig.ConfigCapabilities;

export module TestRunner {
    /**
     * Gets the string path by the full name of the current spec.
     *
     * @return Returns the string path.
     */
    export function getCurrentSpecPath(): string {
        return JasmineTestRunner.getCurrentSpecResult().fullName.replace(/ /, "/").replace(/[^a-z0-9 -/]/gi, "");
    }

    /**
     * Runs tests using the path to the config file.
     *
     * @param configPath The path to config file.
     * @return Returns the promise.
     */
    export function run(options: TestRunnerOptions): Promise<void> {
        return SeleniumServer.isStarted()
            .then(runTests, ex => {
                if(options.autoRunSeleniumServer) {
                    return SeleniumServer.installRun()
                        .then(runTests)
                        .finally(() => SeleniumServer.stop());
                } else {
                    console.log(Chalk.red("Selenium server is not running! - " + ex));
                    throw ex;
                }
            });

        function runTests() {
            return new TestRunnerInternal(options).run();
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
    }

    class TestRunnerInternal {
        private options: TestRunnerOptions;
        private config: Config;
        private currentCapabilitiesIndex: number;
        private get currentCapabilities(): ConfigCapabilities {
            return this.config.capabilities[this.currentCapabilitiesIndex];
        }
        private reporters: jasmine.Reporter[];
        private generalJasmineDoneResult: any;

        constructor(options: TestRunnerOptions) {
            if(!options) {
                throw new Error("The test runner options should be specified!");
            }

            this.options = options;
            this.config = TestRunnerConfig.applyDefaults(TestRunnerConfig.readConfig(this.options.configPath));
        }

        public run() {

            // sets reporters
            this.reporters = [];
            if(_.isFunction(this.config.jasmine.getReporter)) {
                 this.reporters.push(this.config.jasmine.getReporter());
            }

            this.clearBaselineImages();

            return this.config.capabilities
                .reduce((previous: Promise<any>, current: ConfigCapabilities, index: number) => {
                    this.currentCapabilitiesIndex = index;
                    return previous.then(() => this.runByCapabilities());
                }, Q(() => {}));
        }

        private clearBaselineImages() {
            if(this.config.webdrivercss && this.options.updateBaselineImages) {
                rimraf.sync(this.config.webdrivercss.screenshotRoot);
                rimraf.sync(this.config.webdrivercss.failedComparisonsRoot);
            }
        }

        private runByCapabilities() {
            return this.initWebdriverIO() // initializes webdriver.
                .then(() => { // opens the start page.
                    let startPage = this.config.isStartPageLocalFile()
                        ? "file:///" + this.config.startPage
                        : this.config.startPage;
                    return browser.url(startPage);
                })
                .then(() => this.addFileLinksOnTestPage()) // adds css/script links.
                .then(() => this.executeFilesOnTestPage()) // executes scripts.
                .then(() => { // waits until the page is not ready for testing.
                    if(_.isFunction(this.config.waitUntil)) {
                        return browser.waitUntil(() => browser
                                .execute(this.config.waitUntil)
                                .then(result => !!result.value));
                    }
                })
                .then(() => { // initializes jasmine.
                    JasmineTestRunner.init();
                    jasmine.DEFAULT_TIMEOUT_INTERVAL = this.config.jasmine.defaultTimeoutInterval;
                    this.addReporters();
                })
                .then(() => JasmineTestRunner.run(this.config.specs, this.config.exclude, this.config.rootDir)) // runs jasmine.
                .catch((ex) => { 
                    console.error(Chalk.red(ex));
                    throw ex;
                })
                .finally(() => browser.endAll()); // closes the browser window.
        }

        private addFileLinksOnTestPage() {
            if(!_.isArray(this.config.files)) {
                return;
            }

            let files = _.flatten(this.config.files.map(v => {
                if(Url.parse(v) && Url.parse(v).host) {
                    return v;
                } else {
                    if(this.config.isStartPageLocalFile()) {
                        let startPageDirName = Path.dirname(this.config.startPage);
                        return Helpers.getFilesByGlob(v, [], this.config.rootDir)
                            .map(x => Path.relative(startPageDirName, x).replace(/\\/g, "/"));
                    }
                }
            })).filter(x => !!x);

            return files.reduce((promise: Promise<any>, file: string) => {
                return promise.then(() => {
                    switch(Path.extname(file).toLowerCase()) {
                        case ".js": return browser.execute(function(src) {
                                var script = document.createElement("script");
                                script.src = src;
                                script.type = "text/javascript";
                                var head = document.getElementsByTagName("head")[0];
                                (head || document.body).appendChild(script);
                            }, file);
                        case ".css": return browser.execute(function(src) {
                            var link = document.createElement("link");
                            link.href = src;
                            link.type = "text/css";
                            link.rel = "stylesheet";
                            var head = document.getElementsByTagName("head")[0];
                            (head || document.body).appendChild(link);
                        }, file);
                        default: return Q<any>(() => {});
                    }
                });
            }, Q(() => {}))
                .then(() => browser.executeAsync(function(done) { setTimeout(done, 0); }));
        }

        private executeFilesOnTestPage() {
            if(!_.isArray(this.config.execFiles)) {
                return;
            }

            let files = Helpers.getFilesByGlob(this.config.execFiles, [], this.config.rootDir);
            return files.reduce((promise: Promise<any>, file: string) => {
                return promise.then(() => {
                    let src = FS.readFileSync(file, "utf8");
                    return browser.execute(function(code) { eval.call(window, code); }, src);
                });
            }, Q(() => {}));
        }

        private addReporters() {
            let getSpecResult = (value: jasmine.SpecResult) => {
                value = _.cloneDeep(value);
                value.fullName = getPrefix() + value.fullName;
                value.id += getPrefix();
                return value;
            }
            let getSuiteResult = (value: jasmine.SpecResult) => {
                value = _.cloneDeep(value);
                value.description = getPrefix() + value.description;
                value.id += getPrefix();
                return value;
            }
            let getPrefix = () => {
                return `[${this.currentCapabilities.getDefaultName()}] `;
            }

            let reporter = <jasmine.Reporter>{
                jasmineStarted: (value) => {
                    if(this.currentCapabilitiesIndex !== 0) {
                        return;
                    }

                    value = _.cloneDeep(value);
                    value.totalSpecsDefined *= this.config.capabilities.length;

                    this.reporters.forEach(x => x.jasmineStarted(value));
                },
                jasmineDone: (value) => {
                    if(this.generalJasmineDoneResult) {
                        value.failedExpectations.forEach(
                            this.generalJasmineDoneResult.failedExpectations.push);
                    } else {
                        this.generalJasmineDoneResult = value;
                    }

                    if(this.currentCapabilitiesIndex !== this.config.capabilities.length - 1) {
                        return;
                    }

                    this.reporters.forEach(x => x.jasmineDone(this.generalJasmineDoneResult));
                },
                suiteStarted: (value) => {
                    value = getSuiteResult(value);
                    this.reporters.forEach(x => x.suiteStarted(value));
                },
                suiteDone: (value) => {
                    value = getSuiteResult(value);
                    this.reporters.forEach(x => x.suiteDone(value));
                },
                specStarted: (value) => {
                    value = getSpecResult(value);
                    this.reporters.forEach(x => x.specStarted(value));
                },
                specDone: (value) => {
                    value = getSpecResult(value);
                    this.reporters.forEach(x => x.specDone(value));
                }
            };

            jasmine.getEnv().addReporter(reporter);
        }

        private initWebdriverIO() {
            let timeout = this.config.jasmine.defaultTimeoutInterval;
            return Q.fcall(() => (<any>global).browser = WebdriverIO.remote({ // sets the webrdriverio client as a global variable.
                    desiredCapabilities: { 
                        browserName: this.currentCapabilities.browserName
                    },
                    waitforTimeout: timeout
                }))
                .then(() => this.initWebdriverCSS())
                .then(() => initWebdriverIOEx(browser)) // adds helper methods to the webdriverio client.
                .then(() => browser.init()) // initializes the webdriverio client.
                .then(() => { // sets a window size.
                    if(this.config.webdriverio
                        && this.config.webdriverio.windowSize
                        && this.config.webdriverio.windowSize.width > 0
                        && this.config.webdriverio.windowSize.height > 0) {
                        return browser.windowHandleSize(this.config.webdriverio.windowSize);
                    }
                })
                .then(() => browser // sets a timeout.
                    .timeouts("script", timeout)
                    .timeouts("page load", timeout)
                    .timeouts("implicit", timeout)
                    .timeoutsAsyncScript(timeout)
                    .timeoutsImplicitWait(timeout)
                );
        }
        
        private initWebdriverCSS() {
            if(!this.config.webdrivercss) {
                return;
            }

            let screenshotRoot = Path.join(this.config.webdrivercss.screenshotRoot, this.currentCapabilities.getDefaultName());
            let failedComparisonsRoot = Path.join(this.config.webdrivercss.failedComparisonsRoot, this.currentCapabilities.getDefaultName());

            mkdirp.sync(screenshotRoot);
            mkdirp.sync(failedComparisonsRoot);

            WebdriverCSS.init(browser, _.extend(this.config.clone().webdrivercss, {
                screenshotRoot: screenshotRoot,
                failedComparisonsRoot: failedComparisonsRoot
            }));
        }
    }
}