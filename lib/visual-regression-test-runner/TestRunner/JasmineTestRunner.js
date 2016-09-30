"use strict";
var externals_1 = require("../externals");
var exports_1 = require("../exports");
var JasmineTestRunner;
(function (JasmineTestRunner) {
    var currentSpec;
    function init() {
        var jasmineRequire = require("jasmine-core/lib/jasmine-core/jasmine");
        global.jasmine = jasmineRequire.core(jasmineRequire);
        var jasmineInterface = jasmineRequire.interface(jasmine, jasmine.getEnv());
        for (var property in jasmineInterface) {
            global[property] = jasmineInterface[property];
        }
        var execute = jasmine.Spec.prototype.execute;
        jasmine.Spec.prototype.execute = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            currentSpec = this;
            if (JasmineTestRunner.specBeforeExecute) {
                JasmineTestRunner.specBeforeExecute(this);
            }
            return execute.apply(this, args);
        };
    }
    JasmineTestRunner.init = init;
    function run(filesGlob, excludeGlob, rootDir) {
        var files = exports_1.Helpers.getFilesByGlob(filesGlob, excludeGlob, rootDir);
        var defer = externals_1.Q.defer();
        jasmine.getEnv().addReporter({
            jasmineDone: function (value) {
                if (files && files.length > 0) {
                    files.forEach(function (file) { delete require.cache[require.resolve(file)]; }); //We have to remove all required specs from the require.cache
                } //to get the ability to add all suites to a new instance of jasmine again.
                defer.resolve(value);
            }
        });
        files.forEach(require);
        jasmine.getEnv().execute();
        return defer.promise;
    }
    JasmineTestRunner.run = run;
    function getCurrentSpecResult() {
        return currentSpec && currentSpec.result;
    }
    JasmineTestRunner.getCurrentSpecResult = getCurrentSpecResult;
})(JasmineTestRunner = exports.JasmineTestRunner || (exports.JasmineTestRunner = {}));
