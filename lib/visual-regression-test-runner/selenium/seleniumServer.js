"use strict";
var seleniumStandalone = require("selenium-standalone");
var request = require("request");
var seleniumServer;
(function (seleniumServer) {
    var seleniumChild;
    function install() {
        return Q.Promise(function (done, fail) {
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
    seleniumServer.install = install;
    function run() {
        return isStarted()
            .then(function () {
            console.log(Chalk.red("Selenium server is allready run!"));
            return Q.reject();
        }, function (err) { return Q.Promise(function (done, fail) {
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
    seleniumServer.run = run;
    function installRun() {
        return isStarted()
            .then(function () {
            console.log(Chalk.red("Selenium server is allready run!"));
            return Q.reject();
        }, function () { return install().then(function () { return run(); }); });
    }
    seleniumServer.installRun = installRun;
    function isStarted() {
        var req = request.defaults({ json: true });
        var hub = "http://localhost:4444/wd/hub/status";
        return Q.Promise(function (done, fail) {
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
    seleniumServer.isStarted = isStarted;
})(seleniumServer = exports.seleniumServer || (exports.seleniumServer = {}));
