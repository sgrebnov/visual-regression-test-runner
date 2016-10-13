declare function it(expectation: string, assertion?: () => void, ignoreBrowsers?: Browser[] | Browser, timeout?: number): void;
declare function it(expectation: string, assertion?: (done: DoneFnEx) => void, ignoreBrowsers?: Browser[] | Browser,  timeout?: number): void;
declare function xit(expectation: string, assertion?: () => void, ignoreBrowsers?: Browser[] | Browser, timeout?: number): void;
declare function xit(expectation: string, assertion?: (done: DoneFnEx) => void, ignoreBrowsers?: Browser[] | Browser,  timeout?: number): void;
declare function fit(expectation: string, assertion?: () => void, ignoreBrowsers?: Browser[] | Browser, timeout?: number): void;
declare function fit(expectation: string, assertion?: (done: DoneFnEx) => void, ignoreBrowsers?: Browser[] | Browser,  timeout?: number): void;

declare function describe(description: string, specDefinitions: () => void, ignoreBrowsers?: Browser[] | Browser): void;
declare function fdescribe(description: string, specDefinitions: () => void, ignoreBrowsers?: Browser[] | Browser): void;
declare function xdescribe(description: string, specDefinitions: () => void, ignoreBrowsers?: Browser[] | Browser): void;

declare namespace jasmine {
    export const MAX_TIMEOUT: number;
    export let currentBrowser: Browser;
    export let currentSpec: jasmine.Spec;
    export let currentSuite: jasmine.Suite;
    export let WDClient: WebdriverIO.Client<void>;
    export function initTestWDClient(url: string): WebdriverIO.Client<void>;
    export function printConsoleLogsWDClient(): WebdriverIO.Client<void>;
    export let events: NodeJS.EventEmitter;

    interface Suite {
        getAllChildren(): SuiteOrSpec[];
    }
}

interface DoneFnEx extends Function {
    (): void;
    fail: (message?: Error|string) => void;
}