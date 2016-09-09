export declare module helpers {
    function isAppveyor(): boolean;
    function getFilesByGlob(glob: string[] | string, excludeGlob?: string[] | string, rootDir?: string): string[];
}
