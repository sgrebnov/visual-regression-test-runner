export declare module jasmineHelpers {
    function getCurrentSpecResult(): jasmine.SpecResult;
    function getCurrentSpecImagePath(): string;
    function assertImageMatch(pageResults: WebdriverCSS.ComparisonResults | WebdriverIO.Client<WebdriverCSS.ComparisonResults>): void;
}
