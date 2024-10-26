import * as vscode from "vscode";

export class TabProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<
        vscode.TreeItem | undefined | void
    > = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<
        vscode.TreeItem | undefined | void
    > = this._onDidChangeTreeData.event;
    initialState: any;
    treeData: any;

    constructor() {
        //처음 열렸을 때 데이터
        this.initialState = this.initializeState();
        //
        this.treeData;
    }

    initializeState() {
        const allTabs = vscode.window.tabGroups.all.flatMap(
            (group) => group.tabs
        );

        return allTabs;
    }

    // 트리 항목 반환(탭 목록)
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    // 열린 파일 목록을 자식 요소로 제공
    getChildren(
        element?: vscode.TreeItem
    ): vscode.ProviderResult<vscode.TreeItem[]> {
        if (!element) {
            // 현재 열린 파일 목록을 가져옴
            const openFiles = [...vscode.workspace.textDocuments];

            // Git 관련 파일 필터링
            const filteredFiles = this.getFilterFiles(openFiles);

            // 각 파일을 TreeItem으로 변환
            const treeItem = this.createTreeItems(filteredFiles);
            return Promise.resolve(treeItem);
        }

        return [];
    }

    //필터 목록 파일을 제외하고 파일 목록 반환
    private getFilterFiles(
        files: vscode.TextDocument[]
    ): vscode.TextDocument[] {
        return files.filter((doc) => {
            const filePath = doc.uri.fsPath.toLowerCase();

            //1. git 관련 파일 필터
            const gitPatterns = [
                "/.git/",
                ".git/",
                "\\.git\\",
                "/git/",
                "\\git\\",
                "git\\",
                ".git",
            ];

            return !gitPatterns.some((pattern) => filePath.includes(pattern));
        });
    }

    private createTreeItems(files: vscode.TextDocument[]): vscode.TreeItem[] {
        return files.map((doc) => {
            const label = vscode.workspace.asRelativePath(doc.uri.fsPath);
            const item = new vscode.TreeItem(
                label,
                vscode.TreeItemCollapsibleState.None
            );

            // 파일 경로와 명령어 설정을 메서드로 분리
            this.openSelectFile(item, doc.uri);

            return item;
        });
    }

    //파일 클릭 시 파일 열기
    private openSelectFile(item: vscode.TreeItem, uri: vscode.Uri) {
        item.resourceUri = uri;
        item.command = {
            // 파일 클릭 시 해당 파일로 이동
            command: "vscode.open",
            title: "Open File",
            arguments: [uri],
        };
    }

    // 트리 뷰 새로고침
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}
