"use strict";
var exports_1 = require("../exports");
// adds additional helper methods to webdriverio.
function initWebdriverIOEx(client) {
    client.addCommand("assertAreaScreenshotMatch", (function (options) {
        var pageName = exports_1.TestRunner.getCurrentSpecPath();
        return client
            .webdrivercss(pageName, options)
            .then(function (result) {
            return exports_1.JasmineHelpers.webdriverCSSMatch(result);
        });
    }).bind(client), true);
}
exports.initWebdriverIOEx = initWebdriverIOEx;
var WebdriverIOEx;
(function (WebdriverIOEx) {
    (function (Browser) {
        Browser[Browser["chrome"] = "chrome"] = "chrome";
        Browser[Browser["firefox"] = "firefox"] = "firefox";
        Browser[Browser["internetExplorer"] = "internet explorer"] = "internetExplorer";
    })(WebdriverIOEx.Browser || (WebdriverIOEx.Browser = {}));
    var Browser = WebdriverIOEx.Browser;
    var SpecialKeys;
    (function (SpecialKeys) {
        SpecialKeys.CANCEL = "\uE001";
        SpecialKeys.HELP = "\uE002";
        SpecialKeys.BACK_SPACE = "\uE003";
        SpecialKeys.TAB = "\uE004";
        SpecialKeys.CLEAR = "\uE005";
        SpecialKeys.RETURN = "\uE006";
        SpecialKeys.ENTER = "\uE007";
        SpecialKeys.SHIFT = "\uE008";
        SpecialKeys.CONTROL = "\uE009";
        SpecialKeys.ALT = "\uE00A";
        SpecialKeys.PAUSE = "\uE00B";
        SpecialKeys.ESCAPE = "\uE00C";
        SpecialKeys.SPACE = "\uE00D";
        SpecialKeys.PAGE_UP = "\uE00E";
        SpecialKeys.PAGE_DOWN = "\uE00F";
        SpecialKeys.END = "\uE010";
        SpecialKeys.HOME = "\uE011";
        SpecialKeys.ARROW_LEFT = "\uE012";
        SpecialKeys.ARROW_UP = "\uE013";
        SpecialKeys.ARROW_RIGHT = "\uE014";
        SpecialKeys.ARROW_DOWN = "\uE015";
        SpecialKeys.INSERT = "\uE016";
        SpecialKeys.DELETE = "\uE017";
        SpecialKeys.SEMICOLON = "\uE018";
        SpecialKeys.EQUALS = "\uE019";
        SpecialKeys.NUMPAD0 = "\uE01A";
        SpecialKeys.NUMPAD1 = "\uE01B";
        SpecialKeys.NUMPAD2 = "\uE01C";
        SpecialKeys.NUMPAD3 = "\uE01D";
        SpecialKeys.NUMPAD4 = "\uE01E";
        SpecialKeys.NUMPAD5 = "\uE01F";
        SpecialKeys.NUMPAD6 = "\uE020";
        SpecialKeys.NUMPAD7 = "\uE021";
        SpecialKeys.NUMPAD8 = "\uE022";
        SpecialKeys.NUMPAD9 = "\uE023";
        SpecialKeys.MULTIPLY = "\uE024";
        SpecialKeys.ADD = "\uE025";
        SpecialKeys.SEPARATOR = "\uE026";
        SpecialKeys.SUBTRACT = "\uE027";
        SpecialKeys.DECIMAL = "\uE028";
        SpecialKeys.DIVIDE = "\uE029";
        SpecialKeys.F1 = "\uE031";
        SpecialKeys.F2 = "\uE032";
        SpecialKeys.F3 = "\uE033";
        SpecialKeys.F4 = "\uE034";
        SpecialKeys.F5 = "\uE035";
        SpecialKeys.F6 = "\uE036";
        SpecialKeys.F7 = "\uE037";
        SpecialKeys.F8 = "\uE038";
        SpecialKeys.F9 = "\uE039";
        SpecialKeys.F10 = "\uE03A";
        SpecialKeys.F11 = "\uE03B";
        SpecialKeys.F12 = "\uE03C";
        SpecialKeys.META = "\uE03D";
        SpecialKeys.COMMAND = "\uE03D";
    })(SpecialKeys = WebdriverIOEx.SpecialKeys || (WebdriverIOEx.SpecialKeys = {}));
})(WebdriverIOEx = exports.WebdriverIOEx || (exports.WebdriverIOEx = {}));
