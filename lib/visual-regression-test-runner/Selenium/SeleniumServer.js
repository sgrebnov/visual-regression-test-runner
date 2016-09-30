"use strict";
var seleniumStandalone = require("selenium-standalone");
var externals_1 = require("../externals");
var SeleniumServer;
(function (SeleniumServer) {
    var seleniumChild;
    /**
     * Installs the selenium server.
     *
     * @return Returns the promise.
     */
    function install() {
        return externals_1.Q.Promise(function (done, fail) {
            seleniumStandalone.install({
                logger: function (msg) { return console.log(msg); }
            }, function (error) {
                if (error) {
                    return fail(error);
                }
                else {
                    return done(null);
                }
            });
        });
    }
    SeleniumServer.install = install;
    /**
     * Runs the selenium server.
     *
     * @return Returns the promise.
     */
    function run() {
        return isStarted()
            .then(function () {
            console.log(externals_1.Chalk.red("Selenium server is allready run!"));
            return externals_1.Q.reject();
        }, function (err) { return externals_1.Q.Promise(function (done, fail) {
            process.on('uncaughtException', function () { return seleniumChild && seleniumChild.kill(); });
            process.on("exit", function () { return seleniumChild && seleniumChild.kill(); });
            seleniumStandalone.start(function (error, child) {
                if (error) {
                    return fail(error);
                }
                seleniumChild = child;
                done(null);
            });
        }); });
    }
    SeleniumServer.run = run;
    /**
     * Installs and runs the selenium server if it is not running.
     *
     * @return Returns the promise.
     */
    function installRunIfNotRunning() {
        return isStarted().then(function () { return externals_1.Q.resolve(undefined); }, function () { return install().then(function () { return run(); }); });
    }
    SeleniumServer.installRunIfNotRunning = installRunIfNotRunning;
    /**
     * Installs and runs the selenium server.
     *
     * @return Returns the promise.
     */
    function installRun() {
        return isStarted()
            .then(function () {
            console.log(externals_1.Chalk.red("Selenium server is already running!"));
            return externals_1.Q.reject();
        }, function () { return install().then(function () { return run(); }); });
    }
    SeleniumServer.installRun = installRun;
    /**
     * Checks if a selenium server is started.
     *
     * @return Returns the promise.
     */
    function isStarted() {
        var req = externals_1.Request.defaults({ json: true });
        var hub = "http://localhost:4444/wd/hub/status";
        return externals_1.Q.Promise(function (done, fail) {
            req(hub, function (err, res) {
                if (err || res.statusCode !== 200) {
                    fail(err);
                }
                else {
                    done(res);
                }
            });
        });
    }
    SeleniumServer.isStarted = isStarted;
})(SeleniumServer = exports.SeleniumServer || (exports.SeleniumServer = {}));
