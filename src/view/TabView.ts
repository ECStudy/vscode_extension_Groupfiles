import * as vscode from "vscode";

import { Confirm, TAB_VIEW, UpdateAction } from "../type/enums";
import { TreeDataProvider } from "../provider/TreeDataProvider";
import { CommandManager } from "../CommandManager";
import { showInputBox } from "../util";
import { Node } from "../node/Node";
import { Group } from "../node/Group";
import { Tab } from "../node/Tab";
import { colorPalette } from "./color";
import { STORAGE_KEYS } from "../StorageManager";
import { TreeItemType } from "../type/types";
import { CREATE_TYPE } from "../type/group";
import { Command } from "../type/command";

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

    private registerCommandCheckContextMenu = ({
        trueCommand,
        falseCommand,
        whenCondition,
        trueCallback,
        falseCallback,
    }: {
        trueCommand: string;
        falseCommand: string;
        whenCondition: string;
        trueCallback: () => void;
        falseCallback: () => void;
    }) => {
        const setContext = (state: boolean) => {
            vscode.commands.executeCommand("setContext", whenCondition, state);
        };
        this.context.subscriptions.push(
            vscode.commands.registerCommand(trueCommand, () => {
                setContext(true);
                trueCallback();
            })
        );
        this.context.subscriptions.push(
            vscode.commands.registerCommand(falseCommand, () => {
                setContext(false);
                falseCallback();
            })
        );
        setContext(false);
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
            vscode.commands.registerCommand("option1", () => {})
        );

        // 전체 그룹 접기 / 펼치기
        this.registerCommandCheckContextMenu({
            trueCommand: "myext.group.fold",
            falseCommand: "myext.group.unfold",
            whenCondition: "myext:group.fold",
            trueCallback: () => this.handleFoldGroup(),
            falseCallback: () => this.handleFoldGroup(),
        });
        // 주석 보이기 / 숨기기
        this.registerCommandCheckContextMenu({
            trueCommand: "myext.show.description",
            falseCommand: "myext.hide.description",
            whenCondition: "myext:show.description",
            trueCallback: () => this.handleViewDescription(),
            falseCallback: () => this.handleViewDescription(),
        });
        // 탭 Alias 보이기 / 숨기기
        this.registerCommandCheckContextMenu({
            trueCommand: "myext.show.alias",
            falseCommand: "myext.hide.alias",
            whenCondition: "myext:show.alias",
            trueCallback: () => this.handleViewAlias(),
            falseCallback: () => this.handleViewAlias(),
        });
    }

    //command 추가
    private registerCommandHandler() {
        //Group 추가
        vscode.commands.registerCommand(Command.CREATE_GROUP, () => {
            this.handleCreateGroup();
        });

        //Group 추가 + Tab 추가
        vscode.commands.registerCommand(
            Command.CREATE_GROUP_TAB,
            async (uri: vscode.Uri, selectedUris: vscode.Uri[]) => {
                //단축키 추가
                if (!uri && !selectedUris) {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        await this.handleCreateGroupAndTab([
                            editor.document.uri,
                        ]);
                    }
                    return;
                }

                const uris = selectedUris?.length ? selectedUris : [uri];
                await this.handleCreateGroupAndTab(uris);
            }
        );

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

        //#region 제거
        //모든 그룹 삭제
        vscode.commands.registerCommand(Command.DELET_All, () => {
            //그룹 모두 삭제
            this.handleDeleteAll();
        });

        //그룹 제거
        vscode.commands.registerCommand(Command.DELETE_GROUP, (node: Group) => {
            this.handleDelete(node);
        });

        //그룹에 있는 탭 제거
        vscode.commands.registerCommand(Command.DELET_TAB, (node: Tab) => {
            this.handleDelete(node);
        });
        //#endregion

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

        //그룹 주석 변경
        vscode.commands.registerCommand(
            "update.group.description",
            (group: Group) => {
                this.handleUpdateGroup(group, UpdateAction.DESCRIPTION);
            }
        );

        vscode.commands.registerCommand("update.tab.label", (tab) => {
            this.handleUpdateTab(tab, UpdateAction.LABEL);
        });

        vscode.commands.registerCommand("update.tab.description", (tab) => {
            this.handleUpdateTab(tab, UpdateAction.DESCRIPTION);
        });
    }

    private async clearGlobalState() {
        const nodes = this.treeDataProvider.getTree();

        const confirm = await vscode.window.showInformationMessage(
            `Extension reset. Cannot be restored.`,
            Confirm.OK,
            Confirm.Cancel
        );

        if (confirm === Confirm.OK) {
            this.context.globalState.keys().forEach((key) => {
                this.context.globalState.update(key, undefined); // 키 값을 undefined로 설정하여 제거
            });
            nodes.reset();
            this.treeDataProvider.triggerEventRerender();
        }
    }

    async inputGroupPromptInputBox(mode = CREATE_TYPE.NEW) {
        const dispaly_placeHolder =
            mode === CREATE_TYPE.NEW
                ? "새 그룹 이름 추가"
                : "수정할 그룹 이름 입력";
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
        const inputResult = await this.inputGroupPromptInputBox(
            CREATE_TYPE.NEW
        );

        if (inputResult.result) {
            const groupInfo = {
                createType: CREATE_TYPE.NEW,
                label: inputResult.label,
            };

            await this.treeDataProvider.createGroup(groupInfo);
            vscode.window.showInformationMessage(
                `"${inputResult.label}" group has been updated`
            );
        }
    }

    //기존 Group 추가 → Tab 추가
    async handleCreateGroupAndTab(uris?: vscode.Uri[]) {
        const groupList = this.treeDataProvider
            .getGroups()
            .map((group: Node) => {
                return {
                    label: `${group.getLabel()}`,
                    description: `${group.getPath()}`,
                    group: group,
                };
            });

        const quickPick = vscode.window.createQuickPick();
        quickPick.placeholder = "Choose target group or type new group name";
        quickPick.items = groupList; //Group list
        quickPick.ignoreFocusOut = true;

        quickPick.onDidChangeValue((value) => {
            if (value) {
                //새용자가 입력할 때, 입력한 값으로 '새 그룹 생성'
                quickPick.items = [
                    {
                        label: `$(add) Create new group: "${value}"`,
                        description: "New group",
                        alwaysShow: true,
                    },
                    ...groupList.filter((item) =>
                        item.label.toLowerCase().includes(value.toLowerCase())
                    ),
                ];
            } else {
                quickPick.items = groupList;
            }
        });

        quickPick.onDidAccept(async () => {
            const selectedItem = quickPick.selectedItems[0];

            let selectedGroup: Group | undefined;
            let newGroupLabel: string | undefined;

            //새그룹
            if (selectedItem.label.startsWith("$(add)")) {
                newGroupLabel = selectedItem.label.replace(
                    /\$\(add\) Create new group\: "([^"]+)"/g,
                    "$1"
                );
                vscode.window.showInformationMessage(
                    `New group "${newGroupLabel}" created!`
                );
                if (newGroupLabel) {
                    const createPayload = {
                        createType: CREATE_TYPE.NEW,
                        label: newGroupLabel,
                        uris: uris,
                    };

                    //신규 Group 추가
                    await this.treeDataProvider.createGroup(createPayload);
                    vscode.window.showInformationMessage(
                        `"${newGroupLabel}" group has been updated with new tab(s)`
                    );
                }
            } else {
                selectedGroup = (selectedItem as any)?.group as Group;

                if (selectedGroup) {
                    const createPayload = {
                        createType: CREATE_TYPE.PREV,
                        uris: uris,
                        group: selectedGroup,
                    };

                    //신규 Group 추가
                    await this.treeDataProvider.createGroup(createPayload);
                    vscode.window.showInformationMessage(
                        `"${selectedGroup.label}" group has been updated with new tab(s)`
                    );
                }
            }

            quickPick.hide();
        });

        quickPick.show();
    }

    async handleDeleteAll() {
        const nodes = this.treeDataProvider.getTree();

        if (nodes.getChildren().length === 0) {
            return;
        }

        const confirm = await vscode.window.showInformationMessage(
            `Delete groups and tabs?`,
            Confirm.DELETE,
            Confirm.Cancel
        );

        if (confirm === Confirm.DELETE) {
            const beforeChildren = [...nodes.getChildren()];
            nodes.reset();
            this.treeDataProvider.triggerEventRerender();

            //복구
            setTimeout(async () => {
                const confirm = await vscode.window.showInformationMessage(
                    `Deleted all groups. Would you like to recover?`,
                    Confirm.RECOVER,
                    Confirm.DELETE
                );

                if (confirm === Confirm.RECOVER) {
                    nodes.setChildren(beforeChildren);
                    this.treeDataProvider.triggerEventRerender();
                }
            }, 1500);
        }
    }

    //그룹 제거 | 탭 제거
    async handleDelete(node: Group | Tab) {
        if (node.type === TreeItemType.Group) {
            const confirm = await vscode.window.showInformationMessage(
                `Delete group?`,
                Confirm.DELETE,
                Confirm.Cancel
            );

            if (confirm === Confirm.DELETE) {
                this.treeDataProvider.remove(node);
            }
        } else if (node.type === TreeItemType.Tab) {
            this.treeDataProvider.remove(node);
        }
    }

    //그룹에서 그룹 추가하기
    async handleCreateGroupAndCreateGroup(group: Group) {
        const inputResult = await this.inputGroupPromptInputBox(
            CREATE_TYPE.NEW
        );

        if (inputResult.result) {
            const createPayload = {
                createType: CREATE_TYPE.PREV,
                label: inputResult.label,
                group: group,
            };

            this.treeDataProvider.createGroupAndGroup(createPayload);
        }
    }

    applyUpdate(setter: any, payload: any, updatedPayload: any) {
        setter({
            ...payload,
            ...updatedPayload,
        });
    }

    async handleUpdateGroup(group: Group, action: UpdateAction) {
        const payload = {
            label: group.label || "",
            group,
            action,
            color: undefined,
            description: group.description || "",
        };

        switch (action) {
            case UpdateAction.LABEL:
                const label = await showInputBox(
                    "Enter a name for the new group",
                    "수정할 그룹 이름 입력",
                    group.label
                );
                if (label) {
                    this.applyUpdate(
                        (updatedPayload: any) =>
                            this.treeDataProvider.updateGroup(updatedPayload),
                        payload,
                        {
                            label,
                        }
                    );
                }
                break;
            case UpdateAction.COLOR:
                const quickPickItems = colorPalette.map((item) => ({
                    label: `${item.icon} ${item.label}`,
                    value: item.label, // 색상 키를 전달
                }));

                const selectedColor = await vscode.window.showQuickPick(
                    quickPickItems,
                    {
                        placeHolder: "Choose a color for the group icon",
                        canPickMany: false,
                    }
                );

                if (selectedColor) {
                    this.applyUpdate(
                        (updatedPayload: any) =>
                            this.treeDataProvider.updateGroup(updatedPayload),
                        payload,
                        {
                            color: selectedColor.value,
                        }
                    );
                } else {
                    vscode.window.showErrorMessage(
                        "변경할 아이콘을 선택해주세요"
                    );
                }
                break;
            case UpdateAction.DESCRIPTION:
                const description = await showInputBox(
                    "Enter a description for the group",
                    "디스크립션 입력",
                    group?.description
                );
                if (description) {
                    this.applyUpdate(
                        (updatedPayload: any) =>
                            this.treeDataProvider.updateGroup(updatedPayload),
                        payload,
                        {
                            description,
                        }
                    );
                }
                break;
            default:
                vscode.window.showErrorMessage("유효하지 않은 액션입니다.");
                break;
        }
    }

    async handleUpdateTab(tab: Tab, action: UpdateAction) {
        const payload = {
            label: tab.label || "",
            tab,
            action,
            color: undefined,
            description: tab.description || "",
        };

        switch (action) {
            case UpdateAction.LABEL:
                const label = await showInputBox(
                    "Enter a name for the new group",
                    "수정할 탭 이름 입력",
                    tab.label
                );
                if (label) {
                    this.applyUpdate(
                        (updatedPayload: any) =>
                            this.treeDataProvider.updateTab(updatedPayload),
                        payload,
                        {
                            label,
                        }
                    );
                }
                break;
            case UpdateAction.DESCRIPTION:
                const description = await showInputBox(
                    "Enter a description for the group",
                    "디스크립션 입력",
                    tab?.description
                );
                if (description) {
                    this.applyUpdate(
                        (updatedPayload: any) =>
                            this.treeDataProvider.updateTab(updatedPayload),
                        payload,
                        {
                            description,
                        }
                    );
                }

                break;
            default:
                vscode.window.showErrorMessage("유효하지 않은 액션입니다.");
                break;
        }
    }

    //그룹에 속한 파일 열기
    async handleOpenGroupChildren(group: Group) {
        const nodes = group.getChildren();
        for (const node of nodes) {
            if (node.type === TreeItemType.Tab) {
                await vscode.commands.executeCommand("vscode.open", node.uri);
            }
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
        const viewState = this.treeDataProvider.getGlobalState<boolean>(
            STORAGE_KEYS.VIEW_DESCRIPTION
        );
        this.treeDataProvider.setViewDescription(!viewState);
    }

    async handleViewAlias() {
        const viewState = this.treeDataProvider.getGlobalState<boolean>(
            STORAGE_KEYS.VIEW_ALIAS
        );
        this.treeDataProvider.setViewAlias(!viewState);
    }

    async handleDrag(
        nodes: (Group | Tab)[],
        dataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Promise<void> {
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
        const dataTransferItem = dataTransfer.get(
            "application/vnd.code.tree.tab"
        );

        this.treeDataProvider.moveNode(target, dataTransferItem?.value);
    }
}
