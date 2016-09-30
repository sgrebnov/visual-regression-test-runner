import {_, Q, Path, Url, FS, Chalk} from "../externals";

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
    configPath = Path.resolve(configPath);
    if(!FS.existsSync(configPath)) {
        throw new Error("The config file does not exist on this path");
    }

    let config: Config;
    try {
        config = require(configPath);
        if(!config) {
            throw new Error();
        }
    } catch(ex) {
        throw new Error("The config file has an invalid format");
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

    if(config.startPage) {
        if(Url.parse(config.startPage) && Url.parse(config.startPage).host) {
        } else {
            config.startPage = Path.isAbsolute(config.startPage)
                ? config.startPage
                : Path.join(config.rootDir, config.startPage);
        }
    } else {
        config.startPage = Path.join(__dirname, "../../../resources/blank-page.html");
    }

    let isStartPageLocalFile = FS.existsSync(config.startPage);
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
