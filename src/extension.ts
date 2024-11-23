import * as vscode from "vscode";
import { WorkspaceState } from "./state/WorkspaceState";
import { TabView } from "./TabView";
import { BookMark } from "./BookMark";

export function activate(context: vscode.ExtensionContext) {
    WorkspaceState.initState(context);
    context.subscriptions.push(new TabView());
    //context.subscriptions.push(new BookMark());
    // BookmarkProvider 등록
    const bookmarkProvider = new BookMark();
    //views에 들어갈 id는 bookmark-view
    vscode.window.registerTreeDataProvider("bookmark-view", bookmarkProvider);
}

export function deactivate() {}
