import * as seleniumStandalone from "selenium-standalone";
import {_, Q, Path, Globule, Request, child_process, Chalk} from "../externals";
import {Helpers} from "../exports";

export module SeleniumServer {
    let seleniumChild: child_process.ChildProcess;

    /**
	 * Installs the selenium server.
     *
     * @return Returns the promise.
	 */
    export function install() {
        return Q.Promise((done, fail) => {
            seleniumStandalone.install(
                {
                    logger: (msg) => console.log(msg)
                },
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
	 * Runs the selenium server.
     *
     * @return Returns the promise.
	 */
    export function run() {
        return isStarted()
            .then(() => error("Selenium server is already running!"),
                  (err) => Helpers.getJavaVersion()
                      .then(javaVersion => {
                          return startSelenium();
                       }, ex => {
                           return error("Java Runtime Environment is not installed!");
                       })
                  );

        function startSelenium() {
            return Q.Promise((done, fail) => {
                process.on('uncaughtException', stop);
                process.on("exit", () => stop);

                seleniumStandalone.start((error, child) => {
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
     * Installs and runs the selenium server if it is not running.
     *
     * @return Returns the promise.
     */
    export function installRunIfNotRunning() {
        return isStarted().then(() => Q.resolve(undefined), () => install().then(() => run()));
    }

    /**
     * Installs and runs the selenium server.
     *
     * @return Returns the promise.
     */
    export function installRun() {
        return isStarted()
            .then(() => error("Selenium server is already running!"),
                  () => install().then(() => run()));
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
        let req = Request.defaults({json: true});
        let hub = "http://localhost:4444/wd/hub/status";
        return Q.Promise<any>((done, fail) => {
            req(hub, function (err, res) {
                if (err || res.statusCode !== 200) {
                    fail(err);
                } else {
                    done(res);
                }
            });
        });
    }

    function error(errText: string) {
        console.error(Chalk.red(errText));
        return Q.reject();
    }
}