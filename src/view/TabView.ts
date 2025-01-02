import * as vscode from "vscode";

import * as path from "path";
import * as os from "os";
import * as fs from "fs";

import { v4 as uuidv4 } from "uuid";
import { TAB_VIEW } from "../type/enums";
import { TreeDataProvider } from "../provider/TreeDataProvider";
import { CommandManager } from "../CommandManager";
import { getFileName } from "../util";
import { Node } from "../node/Node";

export class TabView extends CommandManager {
    private treeDataProvider: TreeDataProvider;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        super();
        this.context = context;
        this.treeDataProvider = new TreeDataProvider(context);
        vscode.window.createTreeView(TAB_VIEW, {
            treeDataProvider: this.treeDataProvider,
            canSelectMany: true,
            dragAndDropController: this.treeDataProvider, // Drag & Drop 활성화
        });

        this.initializeGlobalState();
        this.registerCommandHandler();
    }

    private async initializeGlobalState() {
        const existingGroups =
            this.context.globalState.get<string>("tabGroups");
        if (!existingGroups) {
            await this.context.globalState.update("tabGroups", "[]");
        }
    }

    //command 추가
    private registerCommandHandler() {
        // + 버튼 : 빈 그룹 추가
        vscode.commands.registerCommand("create.group", () => {
            this.handleCreateGroup();
        });

        //새 그룹에 추가
        vscode.commands.registerCommand(
            "create.tab.new-group",
            (uri: vscode.Uri) => {
                this.handleCreateGroupAndCreateTab(uri);
            }
        );

        //기존 그룹에 추가
        vscode.commands.registerCommand(
            "create.tab.prev-group",
            (uri: vscode.Uri) => {
                this.handlePrebGroupAndCreateTab(uri);
            }
        );
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

    async handleCreateGroup() {
        const inputResult = await this.inputGroupPromptInputBox("new");

        if (inputResult.result) {
            const groupInfo = {
                label: inputResult.label,
                parentId: "root",
            };

            this.treeDataProvider.createGroup(groupInfo);
            vscode.window.showInformationMessage(
                `그룹 "${inputResult}"이 생성되었습니다.`
            );
        }
    }

    async handleCreateGroupAndCreateTab(uri: vscode.Uri) {
        // const quickPickItems = this.treeDataProvider
        //     .getGroups()
        //     .map((group: any) => {
        //         return {
        //             label: `${group.getName()}`,
        //             description: `${group.getPath()}`,
        //         };
        //     });

        // const selectedColor = await vscode.window.showQuickPick(
        //     quickPickItems,
        //     {
        //         placeHolder: "Choose a color for the group icon",
        //         canPickMany: false,
        //     }
        // );

        const selectedGroup = await this.inputGroupPromptInputBox("new");
        if (selectedGroup) {
            const groupInfo = {
                label: selectedGroup.label,
                //parentId: "root",
                uri: uri,
            };

            //빈 그룹 추가 + 탭 추가
            this.treeDataProvider.createGroup(groupInfo);

            vscode.window.showInformationMessage(
                `파일 ${getFileName(uri.path)} 가 그룹 ${
                    selectedGroup.label
                }에 추가 되었습니다.`
            );
        }
    }

    async handlePrebGroupAndCreateTab(uri: vscode.Uri) {
        const quickPickItems = this.treeDataProvider
            .getGroups()
            .map((group: Node) => {
                return {
                    label: `${group.getName()}`,
                    description: `${group.getPath()}`,
                    group: group,
                };
            });

        const selectedGroup = await vscode.window.showQuickPick(
            quickPickItems,
            {
                placeHolder: "Choose a color for the group icon",
                canPickMany: false,
            }
        );

        if (selectedGroup) {
            const groupInfo = {
                uri: uri,
                group: selectedGroup.group,
            };
            this.treeDataProvider.createGroup(groupInfo);

            vscode.window.showInformationMessage(
                `파일 ${getFileName(uri.path)} 가 그룹 ${
                    selectedGroup.label
                }에 추가 되었습니다.`
            );
        }
    }
}
