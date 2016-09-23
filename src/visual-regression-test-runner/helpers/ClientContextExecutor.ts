import * as nodeUUID from "node-uuid";
/*
export class ClientContextExecutor {
    private uid: string;
    private client: WebdriverIO.Client<any>;

    constructor(client: WebdriverIO.Client<any>) {
        this.client = client;
    }

    public initContext(contextFn: () => void) {
        this.uid = "ClientContextExecutor-" + nodeUUID.v1();
        let fnText = /function\s*[a-z0-9_]?\s*\([^()]*?\)\s*\{([\s\S]*)\}/ig.exec(contextFn.toString())[0][1];
        fnText = `function() { ${fnText}; window["${this.uid}"] = function(fn) { return eval("(" + fn + ")()"); }; }`;
        return this.client.execute(fnText);
    }

    public execute(fn: () => any)  {
        let fnText = `function(fn) { return window["${this.uid}"](fn); };`;
        return this.client.execute(fnText, fn);
    }
}*/