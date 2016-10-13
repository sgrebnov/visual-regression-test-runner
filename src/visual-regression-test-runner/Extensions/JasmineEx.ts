import {JasmineHelpers, TestRunner, Helpers} from "../exports";
import {_, Q} from "../externals";
import * as Events from "events";

module JasmineEx {
    export function getJasmineRequireEx() {
        let jasmineRequire = require("jasmine-core/lib/jasmine-core/jasmine");
        let interfaceOriginal: Function = jasmineRequire.interface;
        jasmineRequire.interface = function() {
            let result = interfaceOriginal.apply(this, arguments);
            initJasmineInterfaceEx(result);
            return result;
        }

        return jasmineRequire;
    }

    // adds additional helper methods to webdriverio.
    function initJasmineInterfaceEx(jasmineInterface: any) {
        let jasmineGlobal = <typeof jasmine>jasmineInterface["jasmine"];

        (<any>jasmineGlobal).MAX_TIMEOUT = Math.pow(2, 31) - 1;

        jasmineGlobal.events = new Events.EventEmitter();

        let originalTreeProcessor: Function = (<any>jasmineGlobal).TreeProcessor;
        (<any>jasmineGlobal).TreeProcessor = function(attrs) {
            jasmineGlobal.currentSuite = attrs.tree;
            let nodeStart: Function = attrs.nodeStart;
            attrs.nodeStart = function(node: jasmine.Suite) {
                jasmine.currentSuite = node;
                return nodeStart && nodeStart.apply(this, arguments);
            };
            let nodeComplete = attrs.nodeComplete;
            attrs.nodeComplete = function(node: jasmine.Suite) {
                jasmine.currentSuite = node.parentSuite;
                return nodeComplete && nodeComplete.apply(this, arguments);
            };
            return originalTreeProcessor.apply(this, arguments);
        };

        let specExecute = (<any>jasmineGlobal).Spec.prototype.execute;
        (<any>jasmineGlobal).Spec.prototype.execute = function () {
            jasmineGlobal.currentSpec = this;
            return specExecute.apply(this, arguments);
        };

        (<any>jasmineGlobal).Suite.prototype.getAllChildren = function() {
            let result: any[] = _.clone((<jasmine.Suite>this).children);
            for(let i = 0; i < result.length; i++) {
                if(result[i].children) {
                    result[i].children.forEach(x => result.push(x));
                }
            }

            return result;
        };

        ["it", "fit", "xit", "describe", "fdescribe", "xdescribe"]
            .forEach((fn) => addIgnoreBrowsersParam(jasmineInterface, fn));
        function addIgnoreBrowsersParam(jasmineInterface: any, name: string) {
            let originalFn: Function = jasmineInterface[name];
            jasmineInterface[name] = function() {
                const paramIndex = 2;
                let argsArray = _.toArray(arguments);
                if(argsArray.length <= paramIndex
                    || (!_.isString(argsArray[paramIndex]) && !_.isArray(argsArray[paramIndex]))) {
                    return originalFn.apply(this, argsArray);
                }

                let ignoreBrowsersParam = argsArray.splice(paramIndex, 1)[0];
                let ignoreBrowsers: Browser[] = _.isString(ignoreBrowsersParam) ? [ignoreBrowsersParam] : ignoreBrowsersParam;
                let isIgnore = (<Browser[]>ignoreBrowsers).some(x => x === jasmineGlobal.currentBrowser);

                if(_.startsWith(name, "x") || !isIgnore) {
                    return originalFn.apply(this, argsArray);
                }

                let specOrSuite = <jasmine.SuiteOrSpec>originalFn.apply(this, argsArray);
                let specsOrSuitesToPend: jasmine.SuiteOrSpec[] = [specOrSuite];

                if(_.endsWith(name, "describe")) {
                    let children = (<jasmine.Suite>specOrSuite).getAllChildren();
                    specsOrSuitesToPend = _.concat(specsOrSuitesToPend, children);
                }

                specsOrSuitesToPend.forEach(x => (<any>x).pend("Disabled for the current browser."));
                return specOrSuite;
            };
        }

        ["it", "fit", "xit", "beforeEach", "afterEach", "beforeAll", "afterAll"]
            .forEach((fn) => addPromiseSupport(jasmineInterface, fn));
        function addPromiseSupport(jasmineInterface: any, name: string) {
            let originalFn = jasmineInterface[name];
            jasmineInterface[name] = function() {
                let oldActionIndex = _.findIndex(arguments, fn => _.isFunction(fn));
                if(oldActionIndex < 0) {
                    return originalFn.apply(this, arguments);
                }

                let oldAction: (done?: DoneFn) => any = arguments[oldActionIndex];
                if(oldAction.length > 0) {
                    return originalFn.apply(this, arguments);
                }

                arguments[oldActionIndex] = _.extend(function(done: DoneFn) {
                    try {
                        let result: Promise<any> = oldAction.call(this);
                        if(Q.isPromise(result) || result && result.then && result.then.length === 2) {
                            result.then(done, done.fail);
                        } else {
                            done();
                        }
                    } catch(ex) {
                        done.fail(ex);
                    }
                }, oldAction);

                return originalFn.apply(this, arguments);
            };
        }
    }
}

let jasmineRequire = JasmineEx.getJasmineRequireEx();
export {jasmineRequire as JasmineRequire};