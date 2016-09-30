import {TestRunner} from "./exports";

module.exports.run = function (args: string[]) {

    // If no args given, use process.argv.
    args = args || process.argv;

    // remove nodejs default args
    args = args.slice(2);

    let configPath = args[0];

    if (!configPath) {
        throw new Error("Please specify a valid location of configuration file");
    }

    TestRunner.run(args[0]).then(
        () => {
            console.log('Done');
            process.exit(0);
        },
        () => {
            console.log('Done');
            process.exit(-1);
        });

}

