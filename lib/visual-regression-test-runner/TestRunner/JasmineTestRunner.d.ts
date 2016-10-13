import { Q } from "../externals";
export declare module JasmineTestRunner {
    function init(): void;
    function loadRunnables<T>(files: string[], values: T[], getName: (value: T) => string, beforeSuite?: (value: T) => void): jasmine.Suite[];
    function execute(runnablesToRun?: jasmine.Suite | jasmine.Suite[]): Q.Promise<{}>;
}
