import * as vscode from "vscode";

import { v4 as uuidv4 } from "uuid";

import { CommandManager } from "../command/CommandManager";

import { TreeDataProvider } from "../tab/TreeDataProvider";

export class TabView extends CommandManager {
    private treeDataProvider: TreeDataProvider = new TreeDataProvider();

    constructor() {
        super();

        this.registerCommandHandler();
    }

    private registerCommandHandler() {}
}
