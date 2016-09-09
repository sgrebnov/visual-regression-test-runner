import * as WebdriverIO from "webdriverio";
export { WebdriverIO };
import * as WebdriverCSS from "webdrivercss";
export { WebdriverCSS };
export declare module webdriverIOHelpers {
    enum Browser {
        chrome,
        firefox,
        internetExplorer,
    }
    module SpecialKeys {
        const CANCEL: string;
        const HELP: string;
        const BACK_SPACE: string;
        const TAB: string;
        const CLEAR: string;
        const RETURN: string;
        const ENTER: string;
        const SHIFT: string;
        const CONTROL: string;
        const ALT: string;
        const PAUSE: string;
        const ESCAPE: string;
        const SPACE: string;
        const PAGE_UP: string;
        const PAGE_DOWN: string;
        const END: string;
        const HOME: string;
        const ARROW_LEFT: string;
        const ARROW_UP: string;
        const ARROW_RIGHT: string;
        const ARROW_DOWN: string;
        const INSERT: string;
        const DELETE: string;
        const SEMICOLON: string;
        const EQUALS: string;
        const NUMPAD0: string;
        const NUMPAD1: string;
        const NUMPAD2: string;
        const NUMPAD3: string;
        const NUMPAD4: string;
        const NUMPAD5: string;
        const NUMPAD6: string;
        const NUMPAD7: string;
        const NUMPAD8: string;
        const NUMPAD9: string;
        const MULTIPLY: string;
        const ADD: string;
        const SEPARATOR: string;
        const SUBTRACT: string;
        const DECIMAL: string;
        const DIVIDE: string;
        const F1: string;
        const F2: string;
        const F3: string;
        const F4: string;
        const F5: string;
        const F6: string;
        const F7: string;
        const F8: string;
        const F9: string;
        const F10: string;
        const F11: string;
        const F12: string;
        const META: string;
        const COMMAND: string;
    }
}
