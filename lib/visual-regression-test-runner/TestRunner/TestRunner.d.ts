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
    function run(configPath: string): Promise<void>;
}
