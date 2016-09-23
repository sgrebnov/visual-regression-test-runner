export declare module jasmineTestRunner {
    let specBeforeExecute: (spec: jasmine.Spec) => void;
    function init(): void;
    function run(filesGlob: string[] | string, excludeGlob: string[] | string, rootDir?: string): Q.Promise<{}>;
    function getCurrentSpecResult(): jasmine.SpecResult;
}
