import * as vscode from "vscode";

export class WorkspaceState {
    private static context: vscode.ExtensionContext;

    static setState(context: vscode.ExtensionContext) {
        WorkspaceState.context = context;
    }

    static getState() {
        return WorkspaceState.context;
    }

    static updateState(stage: any) {
        //
    }
}
