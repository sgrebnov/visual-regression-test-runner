import * as path from "path";
import * as fs from "fs";
import * as url from "url";
import * as _ from "lodash";
//import {helpers} from "../_references";

export function getDefault(): Config {
    let config: Config = {
        jasmine: {
            defaultTimeoutInterval: 30000,
            getReporter: () => {
                let JasmineConsoleReporter = require('jasmine-console-reporter');

                return new JasmineConsoleReporter({
                    colors: 2,           // (0|false)|(1|true)|2 
                    cleanStack: true,       // (0|false)|(1|true)|2|3 
                    verbosity: 4,        // (0|false)|1|2|(3|true)|4 
                    listStyle: 'indent', // "flat"|"indent" 
                    activity: false//!helpers.isAppveyor()
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
        clone: () => _.cloneDeep(config),
    }

    return config;
}

export function readConfig(configPath: string): Config {
    configPath = path.resolve(configPath);
    return <Config>_.defaultsDeep(require(configPath), { rootDir: path.dirname(configPath) });
}

export function applyDefaults(originalConfig: Config): Config {
    let config = <Config>_.defaultsDeep(originalConfig, getDefault());

    config.webdrivercss.screenshotRoot = path.isAbsolute(config.webdrivercss.screenshotRoot)
        ? config.webdrivercss.screenshotRoot
        : path.join(config.rootDir, config.webdrivercss.screenshotRoot);

    config.webdrivercss.failedComparisonsRoot = path.isAbsolute(config.webdrivercss.failedComparisonsRoot)
        ? config.webdrivercss.failedComparisonsRoot
        : path.join(config.rootDir, config.webdrivercss.failedComparisonsRoot);

    if(_.isArray(config.capabilities) && config.capabilities.length > 0) {
        config.capabilities.forEach(x => x.getDefaultName = () => x.name || x.browserName);
    } else {
        config.capabilities = [];
    }

    if(config.startPage) {
        if(url.parse(config.startPage) && url.parse(config.startPage).host) {
        } else {
            config.startPage = path.isAbsolute(config.startPage)
                ? config.startPage
                : path.join(config.rootDir, config.startPage);
        }
    } else {
        config.startPage = path.join(__dirname, "../../../resources/blank-page.html");
    }

    let isStartPageLocalFile = fs.existsSync(config.startPage);
    config.isStartPageLocalFile = () => isStartPageLocalFile;

    return config;
}

export interface Config {
    rootDir?: string;
    jasmine?: ConfigJasmine;
    webdriverio?: ConfigWebdriverIO;
    webdrivercss: ConfigWebdriverCss;
    specs?: string[];
    exclude?: string[];
    capabilities?: ConfigCapabilities[];
    startPage?: string;
    isStartPageLocalFile?(): boolean;
    waitUntil?: () => boolean;
    execFiles?: string[];
    files?: string[];
    clone(): Config;
}

export interface ConfigCapabilities {
    name: string;
    browserName: string;
    getDefaultName(): string;
}

export interface ConfigJasmine {
    defaultTimeoutInterval: number;
    getReporter?: () => jasmine.Reporter;
}

export interface ConfigWebdriverCss {
    screenshotRoot?: string;
    failedComparisonsRoot?: string,
    misMatchTolerance?: number;
    screenWidth?: number[];
    saveImages?: boolean;
    updateBaseline?: boolean;
    user?: string;
    api?: string;
    key?: string;
    gmOptions?: ConfigWebdriverCssGmOptions;
}

export interface ConfigWebdriverCssGmOptions {
    appPath: string;
}

export interface ConfigWebdriverIO {
    windowSize?: {
        width: number;
        height: number;
    }
}
