import * as vscode from "vscode";

import { v4 as uuidv4 } from "uuid";
import { Confirm, TAB_VIEW, UpdateAction } from "../type/enums";
import { TreeDataProvider } from "../provider/TreeDataProvider";
import { CommandManager } from "../CommandManager";
import { getFileName } from "../util";
import { Node } from "../node/Node";
import { Group } from "../node/Group";
import { Tab } from "../node/Tab";
import { colorPalette } from "./color";
import { STORAGE_KEYS } from "../StorageManager";
import { Serialize } from "../Serialize";
import { TreeItemType } from "../type/types";

export class TabView extends CommandManager {
    private treeDataProvider: TreeDataProvider;
    private context: vscode.ExtensionContext;

    readonly dropMimeTypes: string[] = ["application/vnd.code.tree.tab"];
    readonly dragMimeTypes: string[] = ["application/vnd.code.tree.tab"];

    constructor(context: vscode.ExtensionContext) {
        super();
        this.context = context;
        this.treeDataProvider = new TreeDataProvider(context);
        vscode.window.createTreeView(TAB_VIEW, {
            treeDataProvider: this.treeDataProvider,
            canSelectMany: true,
            dragAndDropController: this, // Drag & Drop 활성화
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

        //모든 그룹 삭제
        vscode.commands.registerCommand("delete.group.all", (group: Group) => {
            //그룹 모두 삭제
            this.handleDeleteAllGroup(group);
        });

        //그룹에서 그룹 추가
        vscode.commands.registerCommand(
            "create.group.in-group",
            (group: Group) => {
                this.handleCreateGroupAndCreateGroup(group);
            }
        );

        //그룹 라벨 변경
        vscode.commands.registerCommand(
            "update.group.label",
            (group: Group) => {
                this.handleUpdateGroup(group, UpdateAction.LABEL);
            }
        );

        //그룹 제거
        vscode.commands.registerCommand("delete.group", (node: Node) => {
            this.handleRemoveNode(node);
        });

        //그룹에 있는 탭 제거
        vscode.commands.registerCommand("delete.tab", (node: Node) => {
            this.handleRemoveNode(node);
        });

        //그룹에 있는 탭 열기
        vscode.commands.registerCommand("open.group", (group: Group) => {
            this.handleOpenGroupChildren(group);
        });

        //그룹 아이콘 변경
        vscode.commands.registerCommand(
            "update.group.color",
            (group: Group) => {
                this.handleUpdateGroup(group, UpdateAction.COLOR);
            }
        );

        //전체 그룹 접기, 펼치기
        vscode.commands.registerCommand("view.fold-unfold", () => {
            //전체 그룹 접기
            this.handleFoldGroup();
        });
    }

    async inputGroupPromptInputBox(mode = "new") {
        const dispaly_placeHolder =
            mode === "new" ? "새 그룹 이름 추가" : "수정할 그룹 이름 입력";
        const label = await vscode.window.showInputBox({
            prompt: "Enter a name for the new group",
            placeHolder: dispaly_placeHolder,
        });

        if (!label) {
            vscode.window.showErrorMessage("그룹 이름을 입력해주세요.");
            return { label: "", result: false };
        }

        return { label, result: true };
    }

    async handleCreateGroup() {
        const inputResult = await this.inputGroupPromptInputBox("new");

        if (inputResult.result) {
            const groupInfo = {
                label: inputResult.label,
            };

            this.treeDataProvider.createGroup(groupInfo);
            vscode.window.showInformationMessage(
                `그룹 "${inputResult}"이 생성되었습니다.`
            );
        }
    }

    async handleCreateGroupAndCreateTab(uri: vscode.Uri) {
        const selectedGroup = await this.inputGroupPromptInputBox("new");
        if (selectedGroup) {
            const groupInfo = {
                label: selectedGroup.label,
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
                    label: `${group.getLabel()}`,
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

    async handleDeleteAllGroup(group: Group) {
        const confirm = await vscode.window.showInformationMessage(
            `전체 그룹을 삭제하시겠습니까?`,
            Confirm.DELETE,
            Confirm.Cancel
        );

        const tempOriginTreeData = this.treeDataProvider.getGlobalState<string>(
            STORAGE_KEYS.TREE_DATA
        );

        if (confirm === Confirm.DELETE) {
            this.treeDataProvider.resetAll();
            const confirm = await vscode.window.showInformationMessage(
                `전체 그룹을 삭제했습니다. 복구하시겠습니까?`,
                Confirm.Cancel,
                Confirm.KEEP
            );

            if (confirm === Confirm.Cancel && tempOriginTreeData) {
                await this.treeDataProvider.restoreData(tempOriginTreeData);
            }
        }
    }

    //그룹에서 그룹 추가하기
    async handleCreateGroupAndCreateGroup(group: Group) {
        const inputResult = await this.inputGroupPromptInputBox("new");

        if (inputResult.result) {
            const groupInfo = {
                label: inputResult.label,
                group: group,
            };

            this.treeDataProvider.createGroupAndGroup(groupInfo);
        }
    }

    async handleUpdateGroup(group: Group, action: UpdateAction) {
        switch (action) {
            case UpdateAction.LABEL:
                const label = await vscode.window.showInputBox({
                    prompt: "Enter a name for the new group",
                    placeHolder: "수정할 그룹 이름 입력",
                    value: group.label,
                });

                if (!label) {
                    vscode.window.showErrorMessage("그룹 이름을 입력해주세요.");
                    return;
                }

                const groupInfo = {
                    label,
                    group,
                    action: UpdateAction.LABEL,
                };

                this.treeDataProvider.updateGroup(groupInfo);
                break;
            case UpdateAction.COLOR:
                const quickPickItems = colorPalette.map((item) => ({
                    label: `${item.svg} ${item.description}`,
                    description: `Choose ${item.label}`,
                    value: item.label, // 색상 키를 전달
                }));

                const selectedColor = await vscode.window.showQuickPick(
                    quickPickItems,
                    {
                        placeHolder: "Choose a color for the group icon",
                        canPickMany: false,
                    }
                );

                if (!selectedColor) {
                    vscode.window.showErrorMessage(
                        "변경할 아이콘을 선택해주세요"
                    );
                    return;
                }

                const groupInfo2 = {
                    group,
                    action: UpdateAction.COLOR,
                    color: selectedColor?.value,
                };
                this.treeDataProvider.updateGroup(groupInfo2);
                break;
            default:
                break;
        }
    }

    //그룹 제거 OR 탭 제거
    async handleRemoveNode(node: Node) {
        if (node instanceof Group) {
            const confirm = await vscode.window.showInformationMessage(
                `그룹을 삭제하시겠습니까?`,
                Confirm.DELETE,
                Confirm.Cancel
            );

            if (confirm === Confirm.DELETE) {
                this.treeDataProvider.remove(node);
                //TODO 복구 기능 추가
            }
        } else if (node instanceof Tab) {
            this.treeDataProvider.remove(node);
        }
    }

    //그룹에 속한 파일 열기
    async handleOpenGroupChildren(group: Group) {
        const tabs = group.getChildren();
        for (const tab of tabs) {
            await vscode.commands.executeCommand("vscode.open", tab.uri);
        }
    }

    //접기 펼치기
    async handleFoldGroup() {
        const viewCollapse = this.treeDataProvider.getGlobalState<boolean>(
            STORAGE_KEYS.VIEW_COLLAPSE
        );

        const allGroup = this.treeDataProvider.getGroups() as Group[];
        this.treeDataProvider.setCollapsed(allGroup, !viewCollapse);
    }

    async handleDrag(
        node: (Group | Tab)[],
        dataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Promise<void> {
        console.log("Drag source", node);
        console.log("Drag dataTransfer", dataTransfer);
        console.log("Drag token", token);

        if (node) {
            const nodeJson = Serialize.arrayToJson(node);
            console.log("🎈 nodeJson", nodeJson);
            dataTransfer.set(
                "application/vnd.code.tree.tab",
                new vscode.DataTransferItem(nodeJson)
            );
        }
    }

    async handleDrop(
        target: Group | Tab | undefined,
        dataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Promise<void> {
        console.log("drop target", target);
        console.log("drop dataTransfer", dataTransfer);
        console.log("drop token", token);

        const dataTransferItem = dataTransfer.get(
            "application/vnd.code.tree.tab"
        );

        console.log("🎀 dataTransferItem", dataTransferItem);

        console.log("🍤 dataTransferItem", dataTransferItem?.value);
        const dropNodeTabs = dataTransferItem?.value.map((node: any) =>
            Serialize.createNode(node)
        );

        console.log("🍠🍠🍠 드롭 노드, 역직렬화함", dropNodeTabs);

        let targetGroup;
        //드랍한 타겟이 Group
        if (target?.type === TreeItemType.Group) {
            targetGroup = target;
        }
        //드랍한 타겟이 Tab
        else if (target?.type === TreeItemType.Tab) {
            targetGroup = target.getParentNode() as Group;
        } else {
        }

        console.log("🍮 타겟 내려놓은 노드", targetGroup);

        if (targetGroup instanceof Group) {
            this.treeDataProvider.moveTabToGroup(targetGroup, dropNodeTabs);
        }
    }
}
