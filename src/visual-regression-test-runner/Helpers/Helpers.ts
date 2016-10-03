import {_, Q, Path, Globule, Chalk, child_process} from "../externals";

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

    export function getJavaVersion() {
        let deffer = Q.defer();
        var spawn = child_process.spawn('java', ['-version']);

        spawn.on('error', (err) => deffer.reject(err));
        spawn.stderr.on('data', data => {
            data = data.toString().split('\n')[0];
            var javaVersion = new RegExp('java version').test(data)
                ? data.split(' ')[2].replace(/"/g, '')
                : false;
            if(javaVersion) {
                deffer.resolve(javaVersion);
            } else {
                deffer.resolve(null);
            }
        });

        return deffer.promise;
    }
}