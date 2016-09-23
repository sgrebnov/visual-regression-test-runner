"use strict";
var path = require("path");
var globule = require("globule");
var helpers;
(function (helpers) {
    function isAppveyor() {
        return isAppveyor.isAppveyor === undefined
            ? (isAppveyor.isAppveyor = require('is-appveyor'))
            : isAppveyor.isAppveyor;
    }
    helpers.isAppveyor = isAppveyor;
    function getFilesByGlob(glob, excludeGlob, rootDir) {
        var files = globule.find(glob || [], { srcBase: rootDir });
        if (excludeGlob) {
            if (!_.isArray(excludeGlob)) {
                excludeGlob = [excludeGlob];
            }
            files = files.filter(function (file) {
                return !globule.isMatch(excludeGlob, file, { srcBase: rootDir });
            });
        }
        return files.map(function (x) { return path.isAbsolute(x) ? x : path.join(rootDir, x); });
    }
    helpers.getFilesByGlob = getFilesByGlob;
})(helpers = exports.helpers || (exports.helpers = {}));
