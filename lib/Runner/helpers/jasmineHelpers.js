"use strict";
var jasmineHelpers;
(function (jasmineHelpers) {
    var currentSpec;
    (function init() {
        if (!global.jasmine) {
            throw "Jasmine is not loaded!";
        }
        var executeMock = jasmine.Spec.prototype.execute;
        jasmine.Spec.prototype.execute = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            currentSpec = this;
            executeMock.apply(this, args);
        };
    })();
    function getCurrentSpecResult() {
        return currentSpec.result;
    }
    jasmineHelpers.getCurrentSpecResult = getCurrentSpecResult;
    function getCurrentSpecImagePath() {
        return getCurrentSpecResult().fullName.replace(/ /, "/").replace(/[^a-z0-9 -/]/gi, "");
    }
    jasmineHelpers.getCurrentSpecImagePath = getCurrentSpecImagePath;
    function assertImageMatch(pageResults) {
        var pages = _.keys(pageResults);
        expect(pages.length).toBeGreaterThan(0);
        pages.forEach(function (page) {
            expect(page.length).toBeGreaterThan(0);
            pageResults[page].forEach(function (result) {
                var name = result.properties && result.properties.name;
                expect(result.isWithinMisMatchTolerance)
                    .toBeTruthy("Page: " + page + ", name: " + name + ", mismatch: " + result.misMatchPercentage + "%)");
            });
        });
    }
    jasmineHelpers.assertImageMatch = assertImageMatch;
})(jasmineHelpers = exports.jasmineHelpers || (exports.jasmineHelpers = {}));
