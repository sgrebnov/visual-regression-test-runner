import { Q } from "../externals";
export declare module SeleniumServer {
    /**
     * Installs the selenium server.
     *
     * @return Returns the promise.
     */
    function install(): Q.Promise<{}>;
    /**
     * Runs the selenium server.
     *
     * @return Returns the promise.
     */
    function run(): Q.Promise<{}>;
    /**
     * Installs and runs the selenium server if it is not running.
     *
     * @return Returns the promise.
     */
    function installRunIfNotRunning(): Q.Promise<{}>;
    /**
     * Installs and runs the selenium server.
     *
     * @return Returns the promise.
     */
    function installRun(): Q.Promise<{}>;
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
