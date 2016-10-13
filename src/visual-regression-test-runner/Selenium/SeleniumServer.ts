import * as seleniumStandalone from "selenium-standalone";
import {_, Q, Path, Globule, Request, child_process, Chalk, Url} from "../externals";
import {Helpers} from "../exports";

export module SeleniumServer {
    let seleniumChild: child_process.ChildProcess;
    let currentOptions: Options;

    export interface Options {
        version?: string;
        drivers?: {
            chrome?: {
                version?: string
            },
            ie?: {
                version?:  string
            },
            firefox?: {
                version?:  string
            }
        };
        logger?: (message: any) => void;
        seleniumArgs?: (string|number)[];
    }

    /**
	 * Gets the current selenium server options.
     *
     * @return Returns the selenium server options.
	 */
    export function getCurrentOptions(): Options {
        let defaultOptions: Options = {
            //version: "3.0.0-beta4",
            drivers: {
                    chrome: {
                        version: "2.24"
                    },
                    ie: {
                        version: "2.53.1"
                    },
                    firefox: {
                        version: "0.11.1"
                    }
            },
            seleniumArgs: ['-port', 4444, "-host",  "localhost"],
            logger: (msg) => console.log(msg)
        };
        return _.extend(defaultOptions, currentOptions || {});
    }

    /**
	 * sets the current selenium server options.
	 */
    export function setCurrentOptions(options: Options) {
        currentOptions = options;
    }

    /**
	 * Gets the current selenium server host.
     *
     * @return Returns the selenium server host.
	 */
    export function getCurrentHost(): string {
        return getProcessStartArgByName("-host");
    }

    /**
	 * Gets the current selenium server port.
     *
     * @return Returns the selenium server port.
	 */
    export function getCurrentPort(): number {
        return getProcessStartArgByName("-port");
    }

    /**
	 * Installs the selenium server.
     *
     * @return Returns the promise.
	 */
    export function install() {
        return Q.Promise((done, fail) => {
            seleniumStandalone.install(<any>getCurrentOptions(),
                (error) => {
                    if (error) {
                        return fail(error);
                    } else {
                        return done(null);
                    }
                });
        });
    }

    /**
	 * Starts the selenium server.
     *
     * @return Returns the promise.
	 */
    export function start() {
        return isStarted()
            .then(() => { throw "Selenium server is already started!" },
                  (err) => Helpers.getJavaVersion()
                      .then(javaVersion => {
                          return startSelenium();
                       }, ex => {
                           throw "Java Runtime Environment is not installed!";
                       })
                  );

        function startSelenium() {
            return Q.Promise<any>((done, fail) => {
                process.on('uncaughtException', stop);
                process.on("exit", () => stop);

                seleniumStandalone.start(<any>getCurrentOptions(),(error, child) => {
                    if (error) {
                        return fail(error);
                    }

                    seleniumChild = child;
                    done(null);
                });
            });
        }
    }

    /**
     * Installs and starts the selenium server if it is not started.
     *
     * @return Returns the promise.
     */
    export function installStartIfNotStarted() {
        return isStarted().then(() => Q.resolve(undefined), () => install().then(() => start()));
    }

    /**
     * Installs and starts the selenium server.
     *
     * @return Returns the promise.
     */
    export function installStart() {
        return isStarted()
            .then(() => { throw "Selenium server is already started!" },
                  () => install().then(() => start()));
    }

    /**
     * Stops the selenium server
     *
     * @return Returns the promise.
     */
    export function stop() {
        return seleniumChild && seleniumChild.kill()
    }

    /**
     * Checks if a selenium server is started.
     *
     * @return Returns the promise.
     */
    export function isStarted() {
        let request = Request.defaults({json: true});
        return Q.Promise<any>((done, fail) => {
            request(getSeleniumStatusUrl(), function (err, res) {
                if (err || res.statusCode !== 200) {
                    fail(err);
                } else {
                    done(res);
                }
            });
        });
    }

    function getSeleniumStatusUrl(): string {
        var statusURI = `http://${getCurrentHost()}:${getCurrentPort()}`;
        var nodeStatusAPIPath = "/wd/hub/status";
        var hubStatusAPIPath = "/grid/api/hub";
        switch (getProcessStartArgByName("-role")) {
            case "hub": return statusURI + "/grid/api/hub";
            //case "node":
            default: return statusURI + "/wd/hub/status";
        }
    }

    function getProcessStartArgByName(name: string): any {
        let options = getCurrentOptions();
        let index = options.seleniumArgs.indexOf(name);
        return index >= 0 ? options.seleniumArgs[index + 1] : undefined;
    }
}