"use strict";
var seleniumStandalone = require("selenium-standalone");
var seleniumServer;
(function (seleniumServer) {
    var seleniumChild;
    function install() {
        return new Promise(function (done, fail) {
            seleniumStandalone.install({
                logger: function (msg) { return console.log(msg); }
            }, function (error) {
                if (error) {
                    return fail(error);
                }
                else {
                    return done();
                }
            });
        });
    }
    seleniumServer.install = install;
    function run() {
        var _this = this;
        return new Promise(function (done, fail) {
            process.on('uncaughtException', function () { return seleniumChild && seleniumChild.kill(); });
            process.on("exit", function () { return seleniumChild && seleniumChild.kill(); });
            seleniumStandalone.start(function (error, child) {
                if (error) {
                    return fail(error);
                }
                _this.seleniumChild = child;
                done();
            });
        });
    }
    seleniumServer.run = run;
})(seleniumServer = exports.seleniumServer || (exports.seleniumServer = {}));
