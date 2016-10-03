"use strict";
var externals_1 = require("../externals");
var Helpers;
(function (Helpers) {
    function isAppveyor() {
        return isAppveyor.isAppveyor === undefined
            ? (isAppveyor.isAppveyor = require('is-appveyor'))
            : isAppveyor.isAppveyor;
    }
    Helpers.isAppveyor = isAppveyor;
    function getFilesByGlob(glob, excludeGlob, rootDir) {
        var files = externals_1.Globule.find(glob || [], { srcBase: rootDir });
        if (excludeGlob) {
            if (!externals_1._.isArray(excludeGlob)) {
                excludeGlob = [excludeGlob];
            }
            files = files.filter(function (file) {
                return !externals_1.Globule.isMatch(excludeGlob, file, { srcBase: rootDir });
            });
        }
        return files.map(function (x) { return externals_1.Path.isAbsolute(x) ? x : externals_1.Path.join(rootDir, x); });
    }
    Helpers.getFilesByGlob = getFilesByGlob;
    function getJavaVersion() {
        var deffer = externals_1.Q.defer();
        var spawn = externals_1.child_process.spawn('java', ['-version']);
        spawn.on('error', function (err) { return deffer.reject(err); });
        spawn.stderr.on('data', function (data) {
            data = data.toString().split('\n')[0];
            var javaVersion = new RegExp('java version').test(data)
                ? data.split(' ')[2].replace(/"/g, '')
                : false;
            if (javaVersion) {
                deffer.resolve(javaVersion);
            }
            else {
                deffer.resolve(null);
            }
        });
        return deffer.promise;
    }
    Helpers.getJavaVersion = getJavaVersion;
})(Helpers = exports.Helpers || (exports.Helpers = {}));
