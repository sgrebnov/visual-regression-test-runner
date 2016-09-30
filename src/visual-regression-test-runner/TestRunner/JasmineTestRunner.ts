import {_, Q, Path, Globule, Chalk} from "../externals";
import {Helpers} from "../exports";

export module JasmineTestRunner {
    let currentSpec: jasmine.Spec;
    export let specBeforeExecute: (spec: jasmine.Spec) => void;

    export function init() {
        let jasmineRequire = require("jasmine-core/lib/jasmine-core/jasmine");

        (<any>global).jasmine = jasmineRequire.core(jasmineRequire);
        let jasmineInterface = jasmineRequire.interface(jasmine, jasmine.getEnv());
        for (let property in jasmineInterface) {
            global[property] = jasmineInterface[property];
        }

        let execute = (<any>jasmine).Spec.prototype.execute;
        (<any>jasmine).Spec.prototype.execute = function (...args) {
            currentSpec = <jasmine.Spec>this;
            if(specBeforeExecute) {
                specBeforeExecute(this);
            }

            return execute.apply(this, args)
        }
    }

    export function run(filesGlob: string[] | string, excludeGlob: string[] | string, rootDir?: string) {
        let files = Helpers.getFilesByGlob(filesGlob, excludeGlob, rootDir);

        let defer = Q.defer();
        jasmine.getEnv().addReporter({
            jasmineDone: (value) => {
                if(files && files.length > 0) {
                    files.forEach(file => { delete require.cache[require.resolve(file)]; });//We have to remove all required specs from the require.cache
                }                                                                           //to get the ability to add all suites to a new instance of jasmine again.

                defer.resolve(value);
            }
        });

        files.forEach(require);
        jasmine.getEnv().execute();
        return defer.promise;
    }

    export function getCurrentSpecResult() {
        return currentSpec && currentSpec.result;
    }
}