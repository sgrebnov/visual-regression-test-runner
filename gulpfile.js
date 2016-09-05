var gulp = require("gulp");
var rimraf = require("rimraf");
var runSequence = require("run-sequence")
var builder = require("./builder");

var runnerTsConfigPath = __dirname + "/src/Runner/tsconfig.json";

gulp.task("build", () => {
    builder.build(runnerTsConfigPath);
});

gulp.task("clean", () => {
    builder.clean(runnerTsConfigPath)
});

