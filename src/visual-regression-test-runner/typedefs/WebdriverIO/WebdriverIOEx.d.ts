declare namespace WebdriverIO {
    export interface Client<T> {
        /**
         * Takes screenshots and asserts they and baseline screenshots match using webdrivercss.
         *
         * @param options The WebdriverCSS options.
         *
         * @return Returns the WebdriverIO.Client.
         */
        assertAreaScreenshotMatch(options: WebdriverCSS.Options): Client<void>
    }
}