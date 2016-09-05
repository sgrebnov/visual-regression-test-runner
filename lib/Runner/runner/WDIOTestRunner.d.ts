export declare class WDIOTestRunner {
    private configPath;
    private launcher;
    constructor(configPath: string, options: any);
    run(): Promise<number>;
    private getConfigArgs(config);
}
