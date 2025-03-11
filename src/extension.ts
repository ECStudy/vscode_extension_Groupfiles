import * as vscode from "vscode";

import { TabView } from "./view/views/TabView";

export function activate(context: vscode.ExtensionContext) {
    const tabView = TabView.getInstance(context);
    context.subscriptions.push(tabView);
}

export function deactivate() {}
