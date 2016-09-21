import {jasmineHelpers} from "../_references";
import {testRunner} from "../testRunner/testRunner";

export function initWebdriverIOEx(client: WebdriverIO.Client<any>) {
    client.addCommand("assertAreaScreenshotMatch", ((options: WebdriverCSS.Options) => {
        let pageName = testRunner.getCurrentSpecImagePath();

        return client
            .webdrivercss(pageName, options)
            .then(result => {
                return jasmineHelpers.assertImageMatch(result);
            });
    }).bind(client), true);
}