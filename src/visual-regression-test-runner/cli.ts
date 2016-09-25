import {testRunner} from "./testRunner/testRunner";

module.exports.run = function (args: string[]) {

    // If no args given, use process.argv.
    args = args || process.argv;

    // remove nodejs default args
    args = args.slice(2);

    if (args.length <= 0) {
        throw new Error("Please specify location of configuration file");
    }

    testRunner.run(args[0]).then(
        () => {
            console.log('Done');
            process.exit(0);
        },
        () => {
            console.log('Done');
            process.exit(-1);
        });

}

