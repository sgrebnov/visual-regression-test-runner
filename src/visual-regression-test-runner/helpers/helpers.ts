import * as path from "path";
import * as globule from "globule";

export module helpers {
    export function isAppveyor(): boolean {
        return (<any>isAppveyor).isAppveyor === undefined
            ? ((<any>isAppveyor).isAppveyor = require('is-appveyor'))
            : (<any>isAppveyor).isAppveyor;
    }

    export function getFilesByGlob(glob: string[] | string, excludeGlob?: string[] | string, rootDir?: string) {
        let files: string[] = globule.find(glob || [], { srcBase: rootDir });
        if(excludeGlob) {
            if(!_.isArray(excludeGlob)) {
                excludeGlob = <any>[excludeGlob];
            }

            files = files.filter(file => {
                 return !globule.isMatch(excludeGlob, file, { srcBase: rootDir });
            });
        }
        return files.map(x => path.isAbsolute(x) ? x : path.join(rootDir, x));
    }
}