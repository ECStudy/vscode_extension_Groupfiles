import * as vscode from "vscode";
import { TabProvider } from "./TabProvider";
import { BookmarkProvider } from "./BookmarkProvider";

export function activate(context: vscode.ExtensionContext) {
    console.log("🎈🎈🎈🎈 확장 기능 활성화됨!");

    // TabProvider 등록
    const tabProvider = new TabProvider();
    //views에 들어갈 id는 tab-view
    vscode.window.registerTreeDataProvider("tab-view", tabProvider);

    // BookmarkProvider 등록
    const bookmarkProvider = new BookmarkProvider();
    //views에 들어갈 id는 bookmark-view
    vscode.window.registerTreeDataProvider("bookmark-view", bookmarkProvider);
}

export function deactivate() {}
