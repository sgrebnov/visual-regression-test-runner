var _ = require("lodash");
var typescript = require("typescript");
var globule = require("globule");
var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
var path = require("path");
var fs = require("fs");
var chalk = require("chalk");

function build(tsconfigPath) {
    var tsconfig = getTsconfigData(tsconfigPath);

    var program = typescript.createProgram(tsconfig.files, _.extend({}, tsconfig.compilerOptions));
    var emitResult = program.emit(undefined, (fileName, data) => {
        var targetPath = getAbsoluteOrRelativePath(fileName, __dirname);
        if (tsconfig.compilerOptions.outDir && !isParentOrEqualPath(targetPath, tsconfig.compilerOptions.outDir)) {
            return;
        }

        mkdirp.sync(path.dirname(targetPath));
        fs.writeFileSync(targetPath, data, { encoding: "utf8" });
    });

    var allDiagnostics = typescript.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
    allDiagnostics.forEach(diagnostic => {
        var lc = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        var message = typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        console.log(chalk.red("Compilation error: "
            + diagnostic.file.fileName + " " + (lc.line + 1) + ", " + (lc.character + 1)
            + " " + message));
    });

    return allDiagnostics.length === 0;
}

function clean(tsconfigPath) {
    var tsconfig = getTsconfigData(tsconfigPath);
    rimraf.sync(tsconfig.compilerOptions.outDir);
}

module.exports.build = build;
module.exports.clean = clean;

function getTsconfigData(tsconfigPath) {
    var rootDir = path.dirname(tsconfigPath);
    var tsconfig = require(tsconfigPath);

    if (tsconfig.compilerOptions.rootDir) {
        tsconfig.compilerOptions.rootDir = getAbsoluteOrRelativePath(tsconfig.compilerOptions.rootDir, rootDir);
    }

    if (tsconfig.compilerOptions.outDir) {
        tsconfig.compilerOptions.outDir = getAbsoluteOrRelativePath(tsconfig.compilerOptions.outDir, rootDir);
    }

    var files = [];
    if (tsconfig.files && tsconfig.files.forEach) {
        tsconfig.files.forEach(file => files.push(getAbsoluteOrRelativePath(file, rootDir)));
    }

    if (tsconfig.filesGlob && tsconfig.filesGlob.forEach) {
        var filesGlob = globule.find(tsconfig.filesGlob, { srcBase: rootDir });
        filesGlob.forEach(file => files.push(getAbsoluteOrRelativePath(file, rootDir)));
    }

    return {
        files: files,
        compilerOptions: tsconfig.compilerOptions
    };
}

function getAbsoluteOrRelativePath(targetPath, rootPath) {
    return path.isAbsolute(targetPath) ? targetPath : path.join(rootPath, targetPath);
}

function isParentOrEqualPath(targetPath, parentPath) {
    return path.normalize(targetPath).startsWith(parentPath);
}