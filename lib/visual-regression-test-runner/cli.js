"use strict";
var exports_1 = require("./exports");
module.exports.run = function (args) {
    // If no args given, use process.argv.
    args = args || process.argv;
    // remove nodejs default args
    args = args.slice(2);
    var configPath = args[0];
    if (!configPath) {
        throw new Error("Please specify a valid location of configuration file");
    }
    exports_1.TestRunner.run(args[0]).then(function () {
        console.log('Done');
        process.exit(0);
    }, function () {
        console.log('Done');
        process.exit(-1);
    });
};
