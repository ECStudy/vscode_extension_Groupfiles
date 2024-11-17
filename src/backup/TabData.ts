import * as vscode from "vscode";

export function getOpenTreeData() {
    const allTabs = vscode.window.tabGroups.all.flatMap((group) => group.tabs);

    return allTabs;
}
