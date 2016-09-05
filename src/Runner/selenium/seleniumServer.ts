import * as seleniumStandalone from "selenium-standalone";
import * as child_process from "child_process";

export module seleniumServer {
    let seleniumChild: child_process.ChildProcess;

    export function install() {
        return new Promise((done, fail) => {
            seleniumStandalone.install(
                {
                    logger: (msg) => console.log(msg)
                },
                (error) => {
                    if (error) {
                        return fail(error);
                    } else {
                        return done();
                    }
                });
        });
    }

    export function run() {
        return new Promise((done, fail) => {

            process.on('uncaughtException', () =>seleniumChild && seleniumChild.kill());
            process.on("exit", () => seleniumChild && seleniumChild.kill());

            seleniumStandalone.start((error, child) => {
                if (error) {
                    return fail(error);
                }

                this.seleniumChild = child;
                done();
            });
        });
    }
}