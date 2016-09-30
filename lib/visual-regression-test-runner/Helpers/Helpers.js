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
})(Helpers = exports.Helpers || (exports.Helpers = {}));
