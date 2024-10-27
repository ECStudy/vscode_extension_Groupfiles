import * as vscode from "vscode";

export class BookmarkProvider
    implements vscode.TreeDataProvider<vscode.TreeItem>
{
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
            // Bookmarks 트리 뷰에 데이터 추가
            return [
                new vscode.TreeItem("북마크 1"),
                new vscode.TreeItem("북마크 2"),
                new vscode.TreeItem("북마크 3"),
                new vscode.TreeItem("북마크 4"),
            ];
        }
        return [];
    }
}
