import * as vscode from "vscode";
import { TabProvider } from "./TabProvider";
import { BookmarkProvider } from "./BookmarkProvider";

export function activate(context: vscode.ExtensionContext) {
    console.log("🎈🎈🎈🎈 확장 기능 활성화됨!");

    const openFiles = vscode.workspace.textDocuments;
    console.log("🎀2 현재 열린 파일 목록", openFiles);

    // TabProvider 등록
    const tabProvider = new TabProvider();
    //views에 들어갈 id는 tab-view
    vscode.window.registerTreeDataProvider("tab-view", tabProvider);

    // BookmarkProvider 등록
    const bookmarkProvider = new BookmarkProvider();
    //views에 들어갈 id는 bookmark-view
    vscode.window.registerTreeDataProvider("bookmark-view", bookmarkProvider);

    // 파일 변경될 때 새로고침
    vscode.window.onDidChangeActiveTextEditor(() => {
        tabProvider.refresh();
    });

    // 파일 열때 때 새로고침
    vscode.workspace.onDidOpenTextDocument(() => {
        tabProvider.refresh();
    });

    // 파일 닫을 때 새로고침
    vscode.workspace.onDidCloseTextDocument(() => {
        tabProvider.refresh();
    });

    // 명령어를 통해 트리 뷰 새로고침
    const refreshCommand = vscode.commands.registerCommand(
        "tabView.refresh",
        () => {
            tabProvider.refresh();
        }
    );

    context.subscriptions.push(refreshCommand);
}

export function deactivate() {}
