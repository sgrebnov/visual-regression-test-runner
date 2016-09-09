var gulp = require("gulp");
var rimraf = require("rimraf");
var runSequence = require("run-sequence")
var builder = require("./builder");

var runnerTsConfigPath = __dirname + "/src/SeleniumTestRunner/tsconfig.json";

gulp.task("build", () => {
    return builder.build(runnerTsConfigPath);
});

gulp.task("clean", () => {
    return builder.clean(runnerTsConfigPath)
});

gulp.task("clean-build", () => {
    return runSequence("clean", "build");
});

