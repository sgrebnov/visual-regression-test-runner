import {_, Q, Path, Globule, Chalk} from "../externals";

export module Helpers {
    export function isAppveyor(): boolean {
        return (<any>isAppveyor).isAppveyor === undefined
            ? ((<any>isAppveyor).isAppveyor = require('is-appveyor'))
            : (<any>isAppveyor).isAppveyor;
    }

    export function getFilesByGlob(glob: string[] | string, excludeGlob?: string[] | string, rootDir?: string) {
        let files: string[] = Globule.find(glob || [], { srcBase: rootDir });
        if(excludeGlob) {
            if(!_.isArray(excludeGlob)) {
                excludeGlob = <any>[excludeGlob];
            }

            files = files.filter(file => {
                 return !Globule.isMatch(excludeGlob, file, { srcBase: rootDir });
            });
        }
        return files.map(x => Path.isAbsolute(x) ? x : Path.join(rootDir, x));
    }
}