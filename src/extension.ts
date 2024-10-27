import * as vscode from "vscode";
import { WorkspaceState } from "./state/WorkspaceState";
import { Tabs } from "./Tabs";
import { BookMark } from "./BookMark";

export function activate(context: vscode.ExtensionContext) {
    WorkspaceState.initState(context);
    context.subscriptions.push(new Tabs());
    context.subscriptions.push(new BookMark());
}

export function deactivate() {}
