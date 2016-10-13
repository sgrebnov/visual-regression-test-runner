import {JasmineHelpers, TestRunner, Helpers} from "../exports";
import {_, Q, FS} from "../externals";
import * as WebdriverIO from "webdriverio";

module WebdriverIOEx {
    export function getWebdriverIOEx(): typeof WebdriverIO {
        (<any>global).Browser = Browser;
        let originalRemote = WebdriverIO.remote;
        WebdriverIO.remote = function() {
            let client: WebdriverIO.Client<void> = originalRemote.apply(this, arguments);
            return client.then(() => <any>initWebdriverIOEx(client));
        };

        /*let originalMultiremote = WebdriverIO.multiremote;
        WebdriverIO.multiremote = function() {
            let client: WebdriverIO.Client<void> = originalMultiremote.apply(this, arguments);
            return client.then(() => initWebdriverIOEx(client));
        };*/

        return WebdriverIO;
    }

    // adds additional helper methods to webdriverio.
    function initWebdriverIOEx(client: WebdriverIO.Client<any>) {
        return Q.all([
            addCommand("assertAreaScreenshotMatch", (options: WebdriverCSS.Options) => {
                let pageName = TestRunner.getCurrentSpecPath();
                return client
                    .webdrivercss(pageName, options)
                    .then(result => {
                        return JasmineHelpers.webdriverCSSMatch(result);
                    });
            }),
            addCommand("getBrowserLogsByLevel", (...args: string[]) => {
                return client.log('browser')
                    .then(result => {
                        if(!_.isArray(result.value)) {
                            throw new Error("state: " + (<any>result).state);
                        }

                        return args.length
                            ? result.value.filter(log => args.some(level => log.level === level))
                            : result.value;
                    });
            }),
            addCommand("initConsoleLogReader", () => {
                return client.execute(function() {
                    var consoleLogkey = "webdriverioClientConsoleLogReaderScript";
                    if(window.console[consoleLogkey]) {
                        return false;
                    }

                    window.console[consoleLogkey] = [];
                    var consoleFnNames = ["log", "error", "warn"];
                    var consoleFunctions = consoleFnNames.map(n => <Function>window.console[n]);
                    consoleFnNames.forEach((type, i) => window.console[type] = function(text) {
                        var message: WebdriverIO.ConsoleLog = {
                            type: <any>type,
                            message: text && text.toString()
                        };
                        window.console[consoleLogkey].push(message);
                        return consoleFunctions[i].apply(window.console, arguments);
                    });

                    return true;
                }).then(res => res.value);
            }),
            addCommand("getConsoleLogs", (clear: boolean) => {
                return client.execute(function(clear: boolean) {
                    var consoleLogkey = "webdriverioClientConsoleLogReaderScript";
                    if(window.console[consoleLogkey] === undefined) {
                        return undefined;
                    }

                    var logs = window.console[consoleLogkey];
                    if(clear) {
                        window.console[consoleLogkey] = [];
                    }

                    return logs;
                }, clear).then(res => res.value);
            }),
            addCommand("executeFiles", (files: string[]) => {
                return files.reduce((promise: Promise<any>, file: string) => {
                    return promise.then(() => {
                        let src = FS.readFileSync(file, "utf8");
                        return client.execute(function(code) { eval.call(window, code); }, src);
                    });
                }, Q());
            }),
            replaceCommand("execute", function execute(script: string | Function, ...args: any[]) {
                return executeClientTryCatchedScript(script,
                    s => (<any>execute).original.apply(client, [s].concat(args)));
            }),
            replaceCommand("selectorExecute", function selectorExecute(
                selectors: string | string[],
                script: string | Function,
                ...args: any[]) {
                return executeClientTryCatchedScript(script,
                    s => (<any>selectorExecute).original.apply(client, [selectors, s].concat(args)));
            })
        ]);

        function executeClientTryCatchedScript(
            script: string | Function,
            fn: (script: string | Function) => WebdriverIO.Client<WebdriverIO.RawResult<any>>) {
            const key = "webdriverioClientTryCatchedScript";
            const keyMessage = key + "ErrorMessage";
            const keyStack = key + "ErrorStack";
            const consoleMessages = key + "ConsoleMessages";

            script = getTryCatchedScript(script);
            return fn(script).then(result => {
                throwClientError(result);
                return result;
            });

            function getTryCatchedScript(script: string | Function) {
                if (typeof script === 'string' || typeof script === 'function') {
                    if (typeof script === 'function' || script.trim().indexOf('function') === 0) {
                        script = `return (${script}).apply(null, arguments)`;
                    }

                    script = `return (function ${key}() {
                                    try {
                                        ${script};
                                    } catch(error) {
                                        return { 
                                            ${keyMessage}: (error instanceof Error) ? error.message : error,
                                            ${keyStack}: (error instanceof Error) ? error.stack : "Error: " + error
                                        };
                                    }
                                }).apply(this, arguments)`;
                }

                return script;
            }

            function throwClientError(result: WebdriverIO.RawResult<any>) {
                if(!result.value || !result.value.hasOwnProperty(keyMessage) || !result.value.hasOwnProperty(keyStack)) {
                    return;
                }

                let splitStack = (<string>result.value[keyStack] || "").split("\n");
                if(splitStack.length > 6) {
                    let endIndex = _.findIndex(splitStack, (line: string) => _.startsWith(_.trimStart(line), "at " + key));
                    if(endIndex >= 0) {
                        splitStack =  splitStack.splice(0, endIndex);
                    }

                    if(!_.startsWith(_.trimStart(splitStack[1]), "at ")) {
                        splitStack.splice(1, 1);
                    }
                }

                let targetStack = "[CLIENT-ERROR] " + splitStack.join("\n");
                let error = new Error(result.value[keyMessage]);
                try{throw error;}catch(ex){}
                Object.defineProperty(error, "stack", { get: () => targetStack})
                throw error;
            }
        }

        function addCommand(commandName: string, customMethod: Function) {
            return client.addCommand(commandName, customMethod.bind(client), true);
        }

        function replaceCommand(commandName: string, customMethod: Function) {
            let originalMethod = client[commandName];
            if(!originalMethod.original) {
                (<any>customMethod).original = originalMethod;
                return client.addCommand(commandName,  customMethod.bind(client), true);
            }
        }
    }

    enum Browser {
        chrome = <any>"chrome",
        chromium = <any>"chromium",
        firefox = <any>"firefox",
        internetExplorer = <any>"internet explorer",
        //edge = <any>"edge"
    }

    export module SpecialKeys {
        export const CANCEL = "\uE001";
        export const HELP = "\uE002";
        export const BACK_SPACE = "\uE003";
        export const TAB	= "\uE004";
        export const CLEAR = "\uE005";
        export const RETURN = "\uE006";
        export const ENTER = "\uE007";
        export const SHIFT = "\uE008";
        export const CONTROL	= "\uE009";
        export const ALT	= "\uE00A";
        export const PAUSE = "\uE00B";
        export const ESCAPE = "\uE00C";
        export const SPACE = "\uE00D";
        export const PAGE_UP	= "\uE00E";
        export const PAGE_DOWN = "\uE00F";
        export const END	= "\uE010";
        export const HOME = "\uE011";
        export const ARROW_LEFT = "\uE012";
        export const ARROW_UP = "\uE013";
        export const ARROW_RIGHT = "\uE014";
        export const ARROW_DOWN = "\uE015";
        export const INSERT = "\uE016";
        export const DELETE = "\uE017";
        export const SEMICOLON = "\uE018";
        export const EQUALS = "\uE019";
        export const NUMPAD0 = "\uE01A";
        export const NUMPAD1 = "\uE01B";
        export const NUMPAD2 = "\uE01C";
        export const NUMPAD3 = "\uE01D";
        export const NUMPAD4 = "\uE01E";
        export const NUMPAD5 = "\uE01F";
        export const NUMPAD6 = "\uE020";
        export const NUMPAD7 = "\uE021";
        export const NUMPAD8 = "\uE022";
        export const NUMPAD9 = "\uE023";
        export const MULTIPLY = "\uE024";
        export const ADD = "\uE025";
        export const SEPARATOR = "\uE026";
        export const SUBTRACT = "\uE027";
        export const DECIMAL = "\uE028";
        export const DIVIDE = "\uE029";
        export const F1 = "\uE031";
        export const F2 = "\uE032";
        export const F3 = "\uE033";
        export const F4 = "\uE034";
        export const F5 = "\uE035";
        export const F6 = "\uE036";
        export const F7 = "\uE037";
        export const F8 = "\uE038";
        export const F9 = "\uE039";
        export const F10 = "\uE03A";
        export const F11 = "\uE03B";
        export const F12 = "\uE03C";
        export const META = "\uE03D";
        export const COMMAND = "\uE03D"
    }
    
}

let webdriverIO = WebdriverIOEx.getWebdriverIOEx();
export {webdriverIO as WebdriverIO};