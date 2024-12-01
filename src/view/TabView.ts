import * as vscode from "vscode";

import { v4 as uuidv4 } from "uuid";
import { TAB_VIEW } from "../type/enums";

import { CommandManager } from "../command/CommandManager";

import { TreeDataProvider } from "../tab/TreeDataProvider";

export class TabView extends CommandManager {
    private treeDataProvider: TreeDataProvider = new TreeDataProvider();

    constructor() {
        super();

        //트리 뷰 생성
        vscode.window.createTreeView(TAB_VIEW, {
            treeDataProvider: this.treeDataProvider,
            canSelectMany: true,
        });

        this.registerCommandHandler();
    }

    private registerCommandHandler() {}
}
