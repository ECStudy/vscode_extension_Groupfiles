import * as vscode from "vscode";

export class WorkspaceState {
    private static context: vscode.ExtensionContext;

    static initState(context: vscode.ExtensionContext) {
        WorkspaceState.context = context;
    }

    static getState() {
        return WorkspaceState.context;
    }

    static setState(stage: any) {
        //
    }
}

//workspace state : VS Code에서 열려 있는 프로젝트의 범위나 폴더 정보를 영속적으로 저장하기 위함
