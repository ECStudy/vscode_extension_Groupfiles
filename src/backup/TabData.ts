import * as vscode from "vscode";

export function getOpenTabsData() {
    const allTabs = vscode.window.tabGroups.all.flatMap((group) => group.tabs);

    return allTabs;
}
