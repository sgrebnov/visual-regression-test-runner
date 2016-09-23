///<reference path="./_references.ts"/>
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
global.Q = require("q");
global._ = require("lodash");
global.Chalk = require("chalk");
__export(require("./testRunner/testRunner"));
__export(require("./selenium/seleniumServer"));
