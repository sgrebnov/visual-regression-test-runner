import * as seleniumStandalone from "selenium-standalone";
import * as path from "path";
import * as request from "request";
import * as child_process from "child_process";

export module seleniumServer {
    let seleniumChild: child_process.ChildProcess;

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

    export function installRun() {
        return isStarted()
                .then(() => {
                    console.log(Chalk.red("Selenium server is allready run!"));
                    return Q.reject();
                }, () => install().then(() => run()));
    }

    export function isStarted() {
        let req = request.defaults({json: true});
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