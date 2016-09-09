"use strict";
var jasmineHelpers;
(function (jasmineHelpers) {
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
