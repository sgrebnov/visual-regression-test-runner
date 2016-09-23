export module jasmineHelpers {
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