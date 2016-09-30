import * as seleniumStandalone from "selenium-standalone";
import {_, Q, Path, Globule, Request, child_process, Chalk} from "../externals";

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
            .then(() => {
                console.log(Chalk.red("Selenium server is allready run!"));
                return Q.reject();
            }, (err) => Q.Promise((done, fail) => {

                process.on('uncaughtException', () =>seleniumChild && seleniumChild.kill());
                process.on("exit", () => seleniumChild && seleniumChild.kill());

                seleniumStandalone.start((error, child) => {

                    if (error) {
                        return fail(error);
                    }
                    seleniumChild = child;

                    done(null);
                });
            }));
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
                .then(() => {
                    console.log(Chalk.red("Selenium server is already running!"));
                    return Q.reject();
                }, () => install().then(() => run()));
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
}