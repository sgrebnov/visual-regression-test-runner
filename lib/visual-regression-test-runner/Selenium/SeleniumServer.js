"use strict";
var seleniumStandalone = require("selenium-standalone");
var externals_1 = require("../externals");
var exports_1 = require("../exports");
var SeleniumServer;
(function (SeleniumServer) {
    var seleniumChild;
    var currentOptions;
    /**
     * Gets the current selenium server options.
     *
     * @return Returns the selenium server options.
     */
    function getCurrentOptions() {
        var defaultOptions = {
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
            seleniumArgs: ['-port', 4444, "-host", "localhost"],
            logger: function (msg) { return console.log(msg); }
        };
        return externals_1._.extend(defaultOptions, currentOptions || {});
    }
    SeleniumServer.getCurrentOptions = getCurrentOptions;
    /**
     * sets the current selenium server options.
     */
    function setCurrentOptions(options) {
        currentOptions = options;
    }
    SeleniumServer.setCurrentOptions = setCurrentOptions;
    /**
     * Gets the current selenium server host.
     *
     * @return Returns the selenium server host.
     */
    function getCurrentHost() {
        return getProcessStartArgByName("-host");
    }
    SeleniumServer.getCurrentHost = getCurrentHost;
    /**
     * Gets the current selenium server port.
     *
     * @return Returns the selenium server port.
     */
    function getCurrentPort() {
        return getProcessStartArgByName("-port");
    }
    SeleniumServer.getCurrentPort = getCurrentPort;
    /**
     * Installs the selenium server.
     *
     * @return Returns the promise.
     */
    function install() {
        return externals_1.Q.Promise(function (done, fail) {
            seleniumStandalone.install(getCurrentOptions(), function (error) {
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
     * Starts the selenium server.
     *
     * @return Returns the promise.
     */
    function start() {
        return isStarted()
            .then(function () { throw "Selenium server is already started!"; }, function (err) { return exports_1.Helpers.getJavaVersion()
            .then(function (javaVersion) {
            return startSelenium();
        }, function (ex) {
            throw "Java Runtime Environment is not installed!";
        }); });
        function startSelenium() {
            return externals_1.Q.Promise(function (done, fail) {
                process.on('uncaughtException', stop);
                process.on("exit", function () { return stop; });
                seleniumStandalone.start(getCurrentOptions(), function (error, child) {
                    if (error) {
                        return fail(error);
                    }
                    seleniumChild = child;
                    done(null);
                });
            });
        }
    }
    SeleniumServer.start = start;
    /**
     * Installs and starts the selenium server if it is not started.
     *
     * @return Returns the promise.
     */
    function installStartIfNotStarted() {
        return isStarted().then(function () { return externals_1.Q.resolve(undefined); }, function () { return install().then(function () { return start(); }); });
    }
    SeleniumServer.installStartIfNotStarted = installStartIfNotStarted;
    /**
     * Installs and starts the selenium server.
     *
     * @return Returns the promise.
     */
    function installStart() {
        return isStarted()
            .then(function () { throw "Selenium server is already started!"; }, function () { return install().then(function () { return start(); }); });
    }
    SeleniumServer.installStart = installStart;
    /**
     * Stops the selenium server
     *
     * @return Returns the promise.
     */
    function stop() {
        return seleniumChild && seleniumChild.kill();
    }
    SeleniumServer.stop = stop;
    /**
     * Checks if a selenium server is started.
     *
     * @return Returns the promise.
     */
    function isStarted() {
        var request = externals_1.Request.defaults({ json: true });
        return externals_1.Q.Promise(function (done, fail) {
            request(getSeleniumStatusUrl(), function (err, res) {
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
    function getSeleniumStatusUrl() {
        var statusURI = "http://" + getCurrentHost() + ":" + getCurrentPort();
        var nodeStatusAPIPath = "/wd/hub/status";
        var hubStatusAPIPath = "/grid/api/hub";
        switch (getProcessStartArgByName("-role")) {
            case "hub": return statusURI + "/grid/api/hub";
            //case "node":
            default: return statusURI + "/wd/hub/status";
        }
    }
    function getProcessStartArgByName(name) {
        var options = getCurrentOptions();
        var index = options.seleniumArgs.indexOf(name);
        return index >= 0 ? options.seleniumArgs[index + 1] : undefined;
    }
})(SeleniumServer = exports.SeleniumServer || (exports.SeleniumServer = {}));
