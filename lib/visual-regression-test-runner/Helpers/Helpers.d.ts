export declare module Helpers {
    function isAppveyor(): boolean;
    function getFilesByGlob(glob: string[] | string, excludeGlob?: string[] | string, rootDir?: string): string[];
}
