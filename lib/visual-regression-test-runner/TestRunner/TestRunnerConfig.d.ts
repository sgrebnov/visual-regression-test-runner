export declare function getDefault(): Config;
export declare function readConfig(configPath: string): Config;
export declare function applyDefaults(originalConfig: Config): Config;
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
