import * as vscode from "vscode";

import { TabView } from "./view/TabView";

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(new TabView());
}

export function deactivate() {}
