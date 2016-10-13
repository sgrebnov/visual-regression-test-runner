import {_, Q, Path, Url, FS, Chalk} from "../externals";
import {Helpers} from "../exports";

export function getDefault(): Config {
    let config: Config = {
        jasmine: {
            defaultTimeoutInterval: 30000,
            getReporter: () => {
                let JasmineConsoleReporter = require('jasmine-console-reporter');

                return new JasmineConsoleReporter({
                    colors: Helpers.isVSO() ? 0 : 2,           // (0|false)|(1|true)|2 
                    cleanStack: true,       // (0|false)|(1|true)|2|3 
                    verbosity: 4,        // (0|false)|1|2|(3|true)|4 
                    listStyle: 'indent', // "flat"|"indent" 
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
        initTestMode: InitTestMode.BeforeAll,
        clone: () => _.cloneDeep(config),
    }

    return config;
}

export function readConfig(configPath: string): Config {
    if(!configPath) {
        throw new Error("Please specify a valid location of configuration file");
    }

    configPath = Path.resolve(configPath);
    if(!FS.existsSync(configPath)) {
        throw new Error("The config file does not exist on this path");
    }

    let config: Config;
    try {
        config = require(configPath);
        if(!config) {
            throw new Error(JSON.stringify(config));
        }
    } catch(error) {
        const text = "The config file has an invalid format ";
        if(error instanceof Error) {
            error.message = text + error.message;
        } else {
            error = new Error(text + error);
        }

        throw error;
    }

    return <Config>_.defaultsDeep(config, { rootDir: Path.dirname(configPath) });
}

export function applyDefaults(originalConfig: Config): Config {
    let config = <Config>_.defaultsDeep(originalConfig, getDefault());

    config.webdrivercss.screenshotRoot = Path.isAbsolute(config.webdrivercss.screenshotRoot)
        ? config.webdrivercss.screenshotRoot
        : Path.join(config.rootDir, config.webdrivercss.screenshotRoot);

    config.webdrivercss.failedComparisonsRoot = Path.isAbsolute(config.webdrivercss.failedComparisonsRoot)
        ? config.webdrivercss.failedComparisonsRoot
        : Path.join(config.rootDir, config.webdrivercss.failedComparisonsRoot);

    if(_.isArray(config.capabilities) && config.capabilities.length > 0) {
        config.capabilities.forEach(x => x.getDefaultName = () => x.name || x.browserName);
    } else {
        config.capabilities = [];
    }

    return config;
}

export interface Config {
    rootDir?: string;
    jasmine?: ConfigJasmine;
    webdriverio?: ConfigWebdriverIO;
    webdrivercss: ConfigWebdriverCss;
    specs?: string[];
    capabilities?: ConfigCapabilities[];
    startPage?: string;
    waitUntil?: () => boolean;
    execFiles?: string[];
    initTestMode: InitTestMode;
    files?: string[];
    clone(): Config;
}

export enum InitTestMode {
    BeforeEach = <any>"BeforeEach",
    BeforeAll = <any>"BeforeAll",
    Manually = <any>"Manually"
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
    viewportSize?: {
        width: number;
        height: number;
    }
}
