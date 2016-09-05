import * as path from "path";
import * as Launcher from "webdriverio/build/lib/launcher";

export class WDIOTestRunner {
    private configPath: string;
    private launcher: Launcher;

    constructor(configPath: string, options: any) {
        this.configPath = path.resolve(configPath);
        this.launcher = new Launcher(this.configPath, this.getConfigArgs(require(this.configPath).config));
    }

    public run() {
        return this.launcher.run();
    }

    private getConfigArgs(config) {
        let configArgs: any = {};

        if(config.plugins
            && config.plugins.webdrivercss
            && !(config.plugins.webdrivercss.gmOptions && config.plugins.webdrivercss.gmOptions.appPath)) {

            _.extend(configArgs, {
                plugins: {
                    webdrivercss: {
                        gmOptions: {
                             appPath: require("graphics-magick-binaries").getGMBinariesPathForCurrentSystem()
                        }
                    }
                }
            });
        }

        return configArgs;
    }
}