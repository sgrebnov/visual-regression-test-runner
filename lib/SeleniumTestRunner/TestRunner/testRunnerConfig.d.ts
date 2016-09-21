export declare function getDefault(): Config;
export declare function readConfig(configPath: string): Config;
export interface Config {
    rootDir?: string;
    jasmine?: ConfigJasmine;
    webdriverio?: ConfigWebdriverIO;
    webdrivercss: ConfigWebdriverCss;
    specs?: string[];
    exclude?: string[];
    capabilities?: ConfigCapabilities[];
    startPage?: string;
    waitUntil?: () => boolean;
    injectScripts?: string[];
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
    failedComparisonsRoot?: string;
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
    };
}
