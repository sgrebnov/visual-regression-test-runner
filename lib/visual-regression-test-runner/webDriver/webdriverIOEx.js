"use strict";
var _references_1 = require("../_references");
var testRunner_1 = require("../testRunner/testRunner");
function initWebdriverIOEx(client) {
    client.addCommand("assertAreaScreenshotMatch", (function (options) {
        var pageName = testRunner_1.testRunner.getCurrentSpecImagePath();
        return client
            .webdrivercss(pageName, options)
            .then(function (result) {
            return _references_1.jasmineHelpers.assertImageMatch(result);
        });
    }).bind(client), true);
}
exports.initWebdriverIOEx = initWebdriverIOEx;
