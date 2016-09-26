# visual-regression-test-runner
Test runner for visual regression testing.

##Installation
Install the NPM package:
```sh
npm install visual-regression-test-runner@https://github.com/DenisKudelin/visual-regression-test-runner.git
```
An example repository using visual-regression-test-runner can be found [here.](https://github.com/DenisKudelin/powerbi-visuals-image-comparison-tests)

##Configuration
The configuration file contains all necessary information to run your test suite. Here is an example configuration with all supported properties:
```js
// All patterns or paths are relative to the directory where the config file resides.
module.exports.config = {

    // Jasmine configuration.
    jasmine: {
        defaultTimeoutInterval: 30000
    },

	// [REQUIRED] Patterns of test files to run.
    specs: [
        "./lib/tests/**/*Tests.js",
    ],

	// Patterns of test files that will not be run.
    exclude: [
	    "./lib/tests/**/*NotTests.js"
	],

	// [REQUIRED] Browser list to run tests. All specs will be launched for each browser.
    capabilities: [{
        browserName: "chrome"
    }/*,{
        browserName: "firefox" // is not supported yet
    },{
        browserName: "internet explorer" // is not supported yet
    }*/],

	// Url or path to a html file that will be opened before all specs are started. If not defined, the blank page will be used.
	startPage: "https://www.microsoft.com",

	// Urls or patterns to *.css/*.js files that will be inserted to the start page as link or script blocks. Can be used only for local pages.
    files: [
        "../Externals/JQuery/jquery.js",
    ],

	// Patterns to *.js files that will be evaluated on the start page.
    execFiles: [
        "../helpers/**.js",
    ],

	// Webdrivercss configuration. (These are the default settings)
    webdrivercss: {
        screenshotRoot: "screenshots/originals", // The path to save original screenshots
        failedComparisonsRoot: "screenshots/differents", // The path to save differences from original screenshots
        misMatchTolerance: 0, // Number between 0 and 100 that defines the degree of mismatch to consider two images as identical, increasing this value will decrease test coverage.
        screenWidth: [1920], // If set, all screenshots will be taken in different screen widths (e.g. for responsive design tests)
        gmOptions: { // Graphics Magick options
            appPath: require("graphics-magick-binaries").getGMBinariesPathForCurrentSystem() // Path to the Graphics Magick binaries
        }
    },
}
```

##Writing tests
To write tests we use Jasmine test framework. To access the browser functions we use the global variable "browser".
Here is an example test:
```js
describe("Microsoft", () => {
    it("pagebodyTest", (done) => {
        // Tests run in NodeJS context
        // Use "browser.execute" (http://webdriver.io/api/protocol/execute.html) to run code in browser context
        browser
            // Statement below creates a screenshot and performs verification
            .assertAreaScreenshotMatch({ 
                name: "pagebody", // By default, this will be mapped to ./screenshots/originals/chrome/Microsoft/pagebodyTest.pagebody.1920px.baseline.png
                elem: "div.row-fluid pagebody"
            })
            .then(done);
    });
});
```

##Usage

#### Using exposed NodeJS Api
For example, we can use the gulp to run our tests:
```js
var gulp = require("gulp");
var visualRegressionTestRunner = require("visual-regression-test-runner");

gulp.task("install-start-selenium", () => {
    return visualRegressionTestRunner.seleniumServer
        .install()
        .then(() => visualRegressionTestRunner.seleniumServer.run());
});

gulp.task("run", () => {
    return visualRegressionTestRunner.testRunner
        .run("./config.js") // Path to our config file.
        .catch(() => process.exit(1))
        .then(() => process.exit(0));
});
```

Before running tests we should install and start a selenium server. We can use our own selenium server or just run the command above:
```sh
gulp install-start-selenium
```

Now we can run our tests:
```sh
gulp run
```

#### From command line
```sh
visual-regression-test-runner <path-to-config-file>
```
