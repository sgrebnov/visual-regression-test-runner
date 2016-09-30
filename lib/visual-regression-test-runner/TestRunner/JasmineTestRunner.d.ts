import { Q } from "../externals";
export declare module JasmineTestRunner {
    let specBeforeExecute: (spec: jasmine.Spec) => void;
    function init(): void;
    function run(filesGlob: string[] | string, excludeGlob: string[] | string, rootDir?: string): Q.Promise<{}>;
    function getCurrentSpecResult(): jasmine.SpecResult;
}
