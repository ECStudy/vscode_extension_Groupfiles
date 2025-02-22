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
import { Tree } from "../node/Tree";

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
        this.registerSubscriptionsCommandHandler();
    }

    private async initializeGlobalState() {
        const existingGroups =
            this.context.globalState.get<string>("tabGroups");
        if (!existingGroups) {
            await this.context.globalState.update("tabGroups", "[]");
        }
    }

    private clearGlobalState = () => {
        console.log("Global State가 초기화되었습니다.");
        this.context.globalState.keys().forEach((key) => {
            this.context.globalState.update(key, undefined); // 키 값을 undefined로 설정하여 제거
        });
    };

    private registerSubscriptionsCommandHandler() {
        //TODO : provider로 빼기
        this.context.subscriptions.push(
            vscode.commands.registerCommand("global.state.reset", () => {
                this.clearGlobalState();
            })
        );

        // option1 명령 핸들러
        this.context.subscriptions.push(
            vscode.commands.registerCommand("option1", () => {
                console.log("옵션1");
            })
        );

        // 주석 보이기 / 숨기기
        this.context.subscriptions.push(
            vscode.commands.registerCommand("viewDescription", () => {
                this.handleViewDescription();
            })
        );
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
            this.handleDeleteAllGroup(node);
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

        vscode.commands.registerCommand("update.tab.label", (tab) => {
            this.handleUpdateTab(tab, UpdateAction.LABEL);
        });

        vscode.commands.registerCommand("update.tab.description", (tab) => {
            this.handleUpdateTab(tab, UpdateAction.DESCRIPTION);
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

    async handleDeleteAllGroup(node: Node = this.treeDataProvider.getTree()) {
        const confirm = await vscode.window.showInformationMessage(
            `전체 그룹을 삭제하시겠습니까?`,
            Confirm.DELETE,
            Confirm.Cancel
        );

        if (confirm === Confirm.DELETE) {
            const beforeChildren = [...node.getChildren()];
            node.reset();
            this.treeDataProvider.triggerEventRerender();
            const confirm = await vscode.window.showInformationMessage(
                `전체 그룹을 삭제했습니다. 복구하시겠습니까?`,
                Confirm.Cancel,
                Confirm.KEEP
            );

            if (confirm === Confirm.Cancel) {
                node.setChildren(beforeChildren);
                this.treeDataProvider.triggerEventRerender();
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
    async handleUpdateTab(tab: Tab, action: UpdateAction) {
        switch (action) {
            case UpdateAction.LABEL:
                const label = await vscode.window.showInputBox({
                    prompt: "Enter a name for the new group",
                    placeHolder: "수정할 라벨 이름 입력",
                    value: tab.label,
                });

                if (!label) {
                    vscode.window.showErrorMessage("라벨 이름을 입력해주세요.");
                    return;
                }

                const payload = {
                    label,
                    tab,
                    action: UpdateAction.LABEL,
                };

                this.treeDataProvider.updateTab(payload);
                break;
            case UpdateAction.DESCRIPTION:
                const description = await vscode.window.showInputBox({
                    prompt: "Enter a name for the new group",
                    placeHolder: "디스크립션 입력",
                    value: tab?.description,
                });

                if (!description) {
                    vscode.window.showErrorMessage("디스크립션 입력해주세요.");
                    return;
                }

                //payload 개선
                const payload2 = {
                    description,
                    tab,
                    action: UpdateAction.DESCRIPTION,
                };

                this.treeDataProvider.updateTab(payload2);
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

    async handleViewDescription() {
        const viewDescription = this.treeDataProvider.getGlobalState<boolean>(
            STORAGE_KEYS.VIEW_DESCRIPTION
        );
        this.treeDataProvider.setViewDescription(!viewDescription);
    }

    async handleDrag(
        nodes: (Group | Tab)[],
        dataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Promise<void> {
        console.log("Drag source", nodes);
        console.log("Drag dataTransfer", dataTransfer);
        console.log("Drag token", token);

        if (!nodes?.length) {
            return;
        }

        const filteredPaths: string[] = [];
        const paths = nodes.map((node) => node.getTreePath()).sort();

        paths.forEach((path) => {
            if (
                filteredPaths.some((filteredPath) =>
                    new RegExp(`^${filteredPath}.*`).test(path)
                )
            ) {
                return;
            }
            filteredPaths.push(path);
        });
        console.log("🎈 paths", paths);
        console.log("🎈 filteredPaths", filteredPaths);
        dataTransfer.set(
            "application/vnd.code.tree.tab",
            new vscode.DataTransferItem(filteredPaths)
        );
    }

    async handleDrop(
        target: Group | Tab | undefined,
        dataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Promise<void> {
        //console.log("모든 그룹 상태", this.treeDataProvider.getGroups());

        console.log("drop target", target);
        console.log("drop dataTransfer", dataTransfer);
        console.log("drop token", token);

        const dataTransferItem = dataTransfer.get(
            "application/vnd.code.tree.tab"
        );

        this.treeDataProvider.moveNode(target, dataTransferItem?.value);
    }
}

//TODO
//이동하는 로직 provider에 넣기
//부모가 tree인 그룹은 이동이 불가능함
//동일한 path는 추가가 안되어야함
