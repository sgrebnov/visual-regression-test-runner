import { Q } from "../externals";
export declare module Helpers {
    function isAppveyor(): boolean;
    function promiseSequence(...args: (Promise<any> | any)[]): Promise<any>;
    function getFilesByGlob(glob: string[] | string, excludeGlob?: string[] | string, rootDir?: string): string[];
    function JSONstringifyProto(value: any): string;
    function getJavaVersion(): Q.Promise<{}>;
}
