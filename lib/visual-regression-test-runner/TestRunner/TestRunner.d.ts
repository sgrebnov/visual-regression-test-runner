export declare module TestRunner {
    /**
     * Gets the string path by the full name of the current spec.
     *
     * @return Returns the string path.
     */
    function getCurrentSpecPath(): string;
    /**
     * Runs tests using the path to the config file.
     *
     * @param configPath The path to config file.
     * @return Returns the promise.
     */
    function run(options: TestRunnerOptions): Promise<void>;
    /**
     * Gets test runner options from command line arguments
     *
     * @return Returns test runner options.
     */
    function getCommandLineOptions(): TestRunnerOptions;
    interface TestRunnerOptions {
        configPath: string;
        autoRunSeleniumServer?: boolean;
        updateBaselineImages?: boolean;
    }
}
