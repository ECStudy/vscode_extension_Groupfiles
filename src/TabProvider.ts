import * as vscode from "vscode";

export class TabProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<
        vscode.TreeItem | undefined | void
    > = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<
        vscode.TreeItem | undefined | void
    > = this._onDidChangeTreeData.event;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(
        element?: vscode.TreeItem
    ): vscode.ProviderResult<vscode.TreeItem[]> {
        if (!element) {
            // Tabs 트리 뷰에 데이터 추가
            return [new vscode.TreeItem("탭 1"), new vscode.TreeItem("탭 2")];
        }
        return [];
    }
}
