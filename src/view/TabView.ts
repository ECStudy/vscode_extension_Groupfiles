import * as vscode from "vscode";

import * as path from "path";
import * as os from "os";
import * as fs from "fs";

import { v4 as uuidv4 } from "uuid";
import { TAB_VIEW } from "../type/enums";
import { TreeDataProvider } from "../provider/TreeDataProvider";
import { CommandManager } from "../CommandManager";
import { Node } from "../node/Node";
import { Group } from "../node/Group";
import { Tab } from "../node/Tab";

export class TabView
    extends CommandManager
    implements
        vscode.TreeDataProvider<vscode.TreeItem>,
        vscode.TreeDragAndDropController<Group | Tab>
{
    private treeDataProvider: TreeDataProvider;
    context: vscode.ExtensionContext;

    readonly dropMimeTypes: string[] = ["application/vnd.code.tree.tab"];
    readonly dragMimeTypes: string[] = ["application/vnd.code.tree.tab"];

    // EventEmitter를 정의
    public _onDidChangeTreeData: vscode.EventEmitter<
        vscode.TreeItem | undefined | void
    > = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();

    readonly onDidChangeTreeData: vscode.Event<
        vscode.TreeItem | undefined | void
    > = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext) {
        super();
        this.context = context;
        this.treeDataProvider = new TreeDataProvider(this);
        vscode.window.createTreeView(TAB_VIEW, {
            treeDataProvider: this,
            canSelectMany: true,
            dragAndDropController: this, // Drag & Drop 활성화
        });

        this.initializeGlobalState();
        this.treeDataProvider.initialize();
    }

    private async initializeGlobalState() {
        const existingGroups =
            this.context.globalState.get<string>("tabGroups");
        if (!existingGroups) {
            await this.context.globalState.update("tabGroups", "[]");
        }
    }

    registerCommandHandler(key: string, handler: (...args: any[]) => any) {
        vscode.commands.registerCommand(key, handler);
    }

    async inputGroupPromptInputBox(mode = "new") {
        const dispaly_placeHolder =
            mode === "new" ? "새 그룹 이름 추가" : "수정할 그룹 이름 입력";
        const groupName = await vscode.window.showInputBox({
            prompt: "Enter a name for the new group",
            placeHolder: dispaly_placeHolder,
        });

        if (!groupName) {
            vscode.window.showErrorMessage("그룹 이름을 입력해주세요.");
            return { label: "", result: false };
        }

        return { label: groupName, result: true };
    }

    showInformationMessage(message: string) {
        vscode.window.showInformationMessage(message);
    }

    getTreeItem(element: Group | Tab): vscode.TreeItem {
        return this.treeDataProvider.getTreeItem(elem);
    }

    getChildren(element?: Group | Tab): Group[] {
        return this.treeDataProvider.getChildren(element);
    }
}
