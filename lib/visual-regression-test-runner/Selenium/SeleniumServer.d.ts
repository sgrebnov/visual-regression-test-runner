import { Q } from "../externals";
export declare module SeleniumServer {
    interface Options {
        version?: string;
        drivers?: {
            chrome?: {
                version?: string;
            };
            ie?: {
                version?: string;
            };
            firefox?: {
                version?: string;
            };
        };
        logger?: (message: any) => void;
        seleniumArgs?: (string | number)[];
    }
    /**
     * Gets the current selenium server options.
     *
     * @return Returns the selenium server options.
     */
    function getCurrentOptions(): Options;
    /**
     * sets the current selenium server options.
     */
    function setCurrentOptions(options: Options): void;
    /**
     * Gets the current selenium server host.
     *
     * @return Returns the selenium server host.
     */
    function getCurrentHost(): string;
    /**
     * Gets the current selenium server port.
     *
     * @return Returns the selenium server port.
     */
    function getCurrentPort(): number;
    /**
     * Installs the selenium server.
     *
     * @return Returns the promise.
     */
    function install(): Q.Promise<{}>;
    /**
     * Starts the selenium server.
     *
     * @return Returns the promise.
     */
    function start(): Q.Promise<any>;
    /**
     * Installs and starts the selenium server if it is not started.
     *
     * @return Returns the promise.
     */
    function installStartIfNotStarted(): Q.Promise<any>;
    /**
     * Installs and starts the selenium server.
     *
     * @return Returns the promise.
     */
    function installStart(): Q.Promise<any>;
    /**
     * Stops the selenium server
     *
     * @return Returns the promise.
     */
    function stop(): void;
    /**
     * Checks if a selenium server is started.
     *
     * @return Returns the promise.
     */
    function isStarted(): Q.Promise<any>;
}
