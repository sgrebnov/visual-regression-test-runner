"use strict";
var testRunner_1 = require("./testRunner/testRunner");
module.exports.run = function (args) {
    // If no args given, use process.argv.
    args = args || process.argv;
    // remove nodejs default args
    args = args.slice(2);
    if (args.length <= 0) {
        throw new Error("Please specify location of configuration file");
    }
    testRunner_1.testRunner.run(args[0]).then(function () {
        console.log('Done');
        process.exit(0);
    }, function () {
        console.log('Done');
        process.exit(-1);
    });
};
