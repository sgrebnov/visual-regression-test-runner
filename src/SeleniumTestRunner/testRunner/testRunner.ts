import {helpers} from "../_references";
import * as WebdriverCSS from "webdrivercss";
import * as WebdriverIO from "webdriverio";
import * as path from "path";
import * as fs from "fs";
import * as globule from "globule";
import {jasmineTestRunner} from "./jasmineTestRunner";
import * as testRunnerConfig from "./testRunnerConfig";
import * as mkdirp from "mkdirp";
import * as rimraf from "rimraf";
import {initWebdriverIOEx} from "../webDriver/webdriverIOEx";
import Config = testRunnerConfig.Config;
import ConfigCapabilities = testRunnerConfig.ConfigCapabilities;

export module testRunner {
    const isImageUpdate = !!process.argv.filter(x => x && x.toLowerCase() === "--updateimages")[0];

    export function getCurrentSpecImagePath() {
        return jasmineTestRunner.getCurrentSpecResult().fullName.replace(/ /, "/").replace(/[^a-z0-9 -/]/gi, "");
    }

    export function run(configPath: string): Promise<void> {
        let config = testRunnerConfig.readConfig(configPath);
        return runByConfig(config);
    }

    function runByConfig(config: Config): Promise<void> {
        if(config.webdrivercss && isImageUpdate) {
            rimraf.sync(config.webdrivercss.screenshotRoot);
            rimraf.sync(config.webdrivercss.failedComparisonsRoot);
        }

        let reporters = getReporters(config);
        return config.capabilities
            .reduce((previous: Promise<any>, current: ConfigCapabilities, index: number) => {
                return previous.then(() => runByCapabilities(config, index, reporters));
            }, Q(() => {}));
    }

    function runByCapabilities(config: Config, capabilitiesIndex: number, reporters: jasmine.Reporter[]) {
        let defer = Q.defer();
        return initWebdriverIO(config, config.capabilities[capabilitiesIndex])
            .then(() => {
                if(_.isString(config.startPage)) {
                    return browser.url(config.startPage);
                }
            })
            .then(() => {
                if(_.isArray(config.injectScripts)) {
                    let files = helpers.getFilesByGlob(config.injectScripts, [], config.rootDir);
                    return files.reduce((promise: Promise<any>, file: string) => {
                        return promise.then(() => {
                            let src = fs.readFileSync(file, "utf8");
                            return browser.execute(function(code) { eval(code); }, src);
                        });
                    }, Q(() => {}));
                }
            })
            .then(() => {
                if(_.isFunction(config.waitUntil)) {
                    return browser.waitUntil(() =>
                        browser.execute(config.waitUntil).then(result => !!result.value));
                }
            })
            .then(() => {
                jasmineTestRunner.init();
                jasmine.DEFAULT_TIMEOUT_INTERVAL = config.jasmine.defaultTimeoutInterval;
                addReporters(config, capabilitiesIndex, reporters);
            })
            .then(() => jasmineTestRunner.run(config.specs, config.exclude, config.rootDir))
            .catch((ex) => console.error(Chalk.red(ex)))
            .fin(() => browser.endAll());
    }

    function getReporters(config: Config): jasmine.Reporter[] {
        let reporters: jasmine.Reporter[] = [];
        if(_.isFunction(config.jasmine.getReporter)) {
             reporters.push(config.jasmine.getReporter());
        }

        return reporters;
    }

    function addReporters(config: Config, capabilitiesIndex: number, reporters: jasmine.Reporter[]) {
        let reporter = <jasmine.Reporter>{
            jasmineStarted: (value) => {
                if(capabilitiesIndex !== 0) {
                    return;
                }
                value = _.cloneDeep(value);
                value.totalSpecsDefined *= config.capabilities.length;

                reporters.forEach(x => x.jasmineStarted(value));
            },
            jasmineDone: (value) => {
                if(capabilitiesIndex === 0) {
                    (<any>reporters).mergedJasmineDoneResult = value;
                } else {
                    value.failedExpectations.forEach(
                        (<any>reporters).mergedJasmineDoneResult.failedExpectations.push);
                }
                if(capabilitiesIndex !== config.capabilities.length - 1) {
                    return;
                }

                reporters.forEach(x => x.jasmineDone((<any>reporters).mergedJasmineDoneResult));
            },
            suiteStarted: (value) => {
                value = getSuiteResult(value);
                reporters.forEach(x => x.suiteStarted(value));
            },
            suiteDone: (value) => {
                value = getSuiteResult(value);
                reporters.forEach(x => x.suiteDone(value));
            },
            specStarted: (value) => {
                value = getSpecResult(value);
                reporters.forEach(x => x.specStarted(value));
            },
            specDone: (value) => {
                value = getSpecResult(value);
                reporters.forEach(x => x.specDone(value));
            }
        };

        jasmine.getEnv().addReporter(reporter);

        function getSpecResult(value: jasmine.SpecResult) {
            value = _.cloneDeep(value);
            value.fullName = getPrefix() + value.fullName;
            value.id += getPrefix();
            return value;
        }

        function getSuiteResult(value: jasmine.SpecResult) {
            value = _.cloneDeep(value);
            value.description = getPrefix() + value.description;
            value.id += getPrefix();
            return value;
        }

        function getPrefix() {
            return `[${config.capabilities[capabilitiesIndex].getDefaultName()}] `;
        }
    }

    function initWebdriverIO(config: Config, currentCapabilities: ConfigCapabilities) {
        let timeout = config.jasmine.defaultTimeoutInterval;
        return Q.fcall(() => (<any>global).browser = WebdriverIO.remote({
                desiredCapabilities: { 
                    browserName: currentCapabilities.browserName 
                },
                waitforTimeout: timeout
            }))
            .then(() => initWebdriverCSS(config, currentCapabilities))
            .then(() => initWebdriverIOEx(browser))
            .then(() => browser.init())
            .then(() => {
                if(config.webdriverio
                    && config.webdriverio.windowSize
                    && config.webdriverio.windowSize.width > 0
                    && config.webdriverio.windowSize.height > 0) {
                    return browser.windowHandleSize(config.webdriverio.windowSize);
                }
            })
            .then(() => browser
                .timeouts("script", timeout)
                .timeouts("page load", timeout)
                .timeouts("implicit", timeout)
                .timeoutsAsyncScript(timeout)
                .timeoutsImplicitWait(timeout)
            );
    }

    function initWebdriverCSS(config: Config, currentCapabilities: ConfigCapabilities) {
        if(!config.webdrivercss) {
            return;
        }

        let screenshotRoot = path.join(config.webdrivercss.screenshotRoot, currentCapabilities.getDefaultName());
        let failedComparisonsRoot = path.join(config.webdrivercss.failedComparisonsRoot, currentCapabilities.getDefaultName());

        mkdirp.sync(screenshotRoot);
        mkdirp.sync(failedComparisonsRoot);

        WebdriverCSS.init(browser, _.extend(config.clone().webdrivercss, {
            screenshotRoot: screenshotRoot,
            failedComparisonsRoot: failedComparisonsRoot
        }));
    }
}