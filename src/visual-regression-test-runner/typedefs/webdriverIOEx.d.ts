declare namespace WebdriverIO {
    export interface Client<T> {
        assertAreaScreenshotMatch(options: WebdriverCSS.Options): Client<void>
    }
}