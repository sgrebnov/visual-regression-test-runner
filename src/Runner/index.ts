///<reference path="./_references.ts"/>

(<any>global).Q = require("q");
(<any>global)._ = require("lodash");
(<any>global).Chalk = require("chalk");

export * from "./runner/WDIOTestRunner";
export * from "./selenium/seleniumServer";