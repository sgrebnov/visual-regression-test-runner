export module jasmineHelpers {
    let currentSpec: jasmine.Spec;

    (function init() {
        if(!(<any>global).jasmine) {
            throw "Jasmine is not loaded!";
        }

        let executeMock = (<any>jasmine).Spec.prototype.execute;
        (<any>jasmine).Spec.prototype.execute = function (...args) {
            currentSpec = <jasmine.Spec>this;
            executeMock.apply(this, args)
        }
    })();

    export function getCurrentSpecResult() {
        return currentSpec.result;
    }

    export function getCurrentSpecImagePath() {
        return getCurrentSpecResult().fullName.replace(/ /, "/").replace(/[^a-z0-9 -/]/gi, "");
    }

    export function assertImageMatch(pageResults: WebdriverCSS.ComparisonResults | WebdriverIO.Client<WebdriverCSS.ComparisonResults>) {
        let pages = _.keys(pageResults);
        expect(pages.length).toBeGreaterThan(0);

        pages.forEach(page => {
            expect(page.length).toBeGreaterThan(0);

            pageResults[page].forEach(result => {
                let name = result.properties && result.properties.name;

                expect(result.isWithinMisMatchTolerance)
                    .toBeTruthy(`Page: ${page}, name: ${name}, mismatch: ${result.misMatchPercentage}%)`);
            });
        });
    }
}