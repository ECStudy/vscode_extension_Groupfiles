import * as vscode from "vscode";

import * as path from "path";
import * as os from "os";
import * as fs from "fs";

import { v4 as uuidv4 } from "uuid";
import { TAB_VIEW } from "../type/enums";
import { TreeDataProvider } from "../provider/TreeDataProvider";

export class TabView {
    private treeDataProvider: TreeDataProvider;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
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
            return;
        }

        return groupName;
    }

    async handleCreateGroup() {
        const inputResult = await this.inputGroupPromptInputBox("new");

        if (inputResult) {
            const groupInfo = {
                label: inputResult,
                parentId: "root",
            };

            this.treeDataProvider.createGroup(groupInfo);
            vscode.window.showInformationMessage(
                `그룹 "${inputResult}"이 생성되었습니다.`
            );
        }
    }

    async handleCreateGroupAndCreateTab(uri: vscode.Uri) {
        const quickPickItems = this.treeDataProvider
            .getGroups()
            .map((group: any) => {
                return {
                    label: `${group.getName()}`,
                    description: `${group.getPath()}`,
                };
            });

        const selectedColor = await vscode.window.showQuickPick(
            quickPickItems,
            {
                placeHolder: "Choose a color for the group icon",
                canPickMany: false,
            }
        );

        if (selectedColor) {
            const groupInfo = {
                label: selectedColor.label,
                parentId: "root",
            };

            //1. 빈 그룹 추가
            this.treeDataProvider.createGroup(groupInfo);

            //2. 추가된 그룹 목록 가져오기
            //  const groupMap = this.treeDataProvider.getGroupMap(); // getData로 그룹 리스트 가져오기

            // console.log("그룹 모음", groupMap);

            vscode.window.showInformationMessage(
                `파일 {} 가 그룹 "${selectedColor.label}"에 추가 되었습니다.`
            );
        }
    }
}
