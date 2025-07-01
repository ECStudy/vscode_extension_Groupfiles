import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";

import { CommandManager } from "../managers/CommandManager";

import { TreeDataProvider } from "../../provider/TreeDataProvider";
import { GutterIconProvider } from "../../provider/GutterIconProvider";

import { Node } from "../../node/Node";
import { Group } from "../../node/Group";
import { Tab } from "../../node/Tab";

import { STORAGE_KEYS } from "../../store/StorageManager";
import { globalState } from "../../store/globalState";

import { registerTabViewCommands } from "../../command/registerTabViewCommands";
import { registerToggleContextCommands } from "../../command/registerToggleContextCommands";

import { GetterLineInfo, TreeItemType } from "../../types/types";
import { CREATE_TYPE } from "../../types/group";
import { Confirm, TAB_VIEW, UpdateAction } from "../../types/enums";

import { colorPalette } from "../../constants";
import { showInputBox } from "../../utils/util";

export class TabView extends CommandManager {
    private static instance: TabView | null = null;

    context: vscode.ExtensionContext;

    private treeDataProvider: TreeDataProvider;
    private gutterIconProvider: GutterIconProvider;

    readonly dropMimeTypes: string[] = ["application/vnd.code.tree.tab"];
    readonly dragMimeTypes: string[] = ["application/vnd.code.tree.tab"];

    private constructor(context: vscode.ExtensionContext) {
        super();
        this.context = context;

        this.treeDataProvider = TreeDataProvider.getInstance(context);
        this.gutterIconProvider = GutterIconProvider.getInstance(context);

        vscode.window.createTreeView(TAB_VIEW, {
            treeDataProvider: this.treeDataProvider,
            canSelectMany: true,
            dragAndDropController: this, // Drag & Drop 활성화
        });

        this.initializeGlobalState();

        //command 등록
        registerTabViewCommands(this);
        registerToggleContextCommands(this);
    }

    public static getInstance(context: vscode.ExtensionContext): TabView {
        if (!TabView.instance) {
            TabView.instance = new TabView(context);
        }

        return TabView.instance;
    }

    private initializeGlobalState() {
        globalState.initialize(this.context);
    }

    async handleClearGlobalState() {
        const nodes = this.treeDataProvider.getTree();

        const confirm = await vscode.window.showInformationMessage(
            `Extension reset. Cannot be restored!`,
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

    //빈 그룹 추가하기
    async handleCreateGroup() {
        const input = await showInputBox({
            prompt: "Enter a name for the group",
            placeHolder: "Enter the group name",
        });

        if (input.state) {
            const groupInfo = {
                createType: CREATE_TYPE.NEW,
                label: input.input,
            };

            await this.treeDataProvider.createGroup(groupInfo);
            vscode.window.showInformationMessage(
                `Group "${input.input}" has been created`
            );
        }
    }

    //그룹에서 그룹 추가하기
    async handleCreateGroupAndGroup(group: Group) {
        const input = await showInputBox({
            prompt: "Enter a name for the group",
            placeHolder: "Enter the group name",
        });

        if (input.state) {
            const createPayload = {
                createType: CREATE_TYPE.PREV,
                label: input.input,
                group: group,
            };

            this.treeDataProvider.createGroupAndGroup(createPayload);
        }
    }

    //기존 Group 추가 → Tab 추가
    async handleCreateGroupAndTab(uris?: vscode.Uri[]) {
        const allowUris = uris?.some(
            (uri) => uri.scheme === "file" || uri.scheme === "git-graph"
        );

        if (!allowUris) {
            return;
        }
        const groupList = this.treeDataProvider
            .getGroups()
            .map((group: Node) => {
                return {
                    label: `${group.getLabel()}`,
                    description: `${group.getPath()}`,
                    group: group,
                };
            });

        //유틸로 이동
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

        return new Promise<Group | undefined>((resolve) => {
            // Promise가 이미 해결되었는지 추적하는 플래그
            let isResolved = false;

            const resolveOnce = (value: Group | undefined) => {
                if (!isResolved) {
                    isResolved = true;
                    resolve(value);
                }
            };

            quickPick.onDidAccept(async () => {
                try {
                    // 선택된 항목이 없으면 일찍 반환
                    if (
                        !quickPick.selectedItems ||
                        quickPick.selectedItems.length === 0
                    ) {
                        quickPick.hide();
                        resolveOnce(undefined);
                        return;
                    }

                    const selectedItem = quickPick.selectedItems[0];

                    let selectedGroup: Group | undefined;
                    let newGroupLabel: string | undefined;
                    let resultGroup: Group | undefined;

                    // 워크스페이스 폴더 확인
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (!workspaceFolders) {
                        vscode.window.showErrorMessage("No workspace found.");
                        quickPick.hide();
                        resolveOnce(undefined);
                        return;
                    }
                    const workspaceRootUri = workspaceFolders[0].uri;
                    const workspaceUri = workspaceRootUri;

                    // 새그룹
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
                                workspaceUri: workspaceUri,
                            };

                            resultGroup =
                                await this.treeDataProvider.createGroup(
                                    createPayload
                                );
                            vscode.window.showInformationMessage(
                                `"${newGroupLabel}" group has been updated with new tab(s)`
                            );
                        }
                    } // 기존 그룹 사용 케이스
                    else {
                        if (!selectedItem || !(selectedItem as any)?.group) {
                            console.error(
                                "Selected item or group is undefined:",
                                selectedItem
                            );
                            quickPick.hide();
                            resolveOnce(undefined);
                            return;
                        }

                        selectedGroup = (selectedItem as any)?.group as Group;

                        if (selectedGroup) {
                            const createPayload = {
                                createType: CREATE_TYPE.PREV,
                                uris: uris,
                                group: selectedGroup,
                                workspaceUri: workspaceUri,
                            };

                            resultGroup =
                                await this.treeDataProvider.createGroup(
                                    createPayload
                                );
                            vscode.window.showInformationMessage(
                                `"${selectedGroup.label}" group has been updated with new tab(s)`
                            );
                        }
                    }

                    quickPick.hide();
                    // 그룹 반환
                    resolveOnce(resultGroup);
                } catch (error) {
                    console.error("Error in handleCreateGroupAndTab:", error);
                    quickPick.hide();
                    resolveOnce(undefined);
                }
            });

            quickPick.onDidHide(() => {
                // 아직 Promise가 해결되지 않았다면 undefined로 해결
                resolveOnce(undefined);
            });

            quickPick.show();
        });
    }

    async handleDeleteAll() {
        const nodes = this.treeDataProvider.getTree();

        if (nodes.getChildren().length === 0) {
            return;
        }

        const confirm = await vscode.window.showInformationMessage(
            `Delete all groups and tabs?`,
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
                `Delete this group?`,
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
            case UpdateAction.LABEL: {
                const result = await showInputBox({
                    prompt: "Enter a label for the group",
                    placeHolder: "Enter the group label",
                    value: group.label,
                });
                if (result.state) {
                    this.applyUpdate(
                        (updatedPayload: any) =>
                            this.treeDataProvider.updateGroup(updatedPayload),
                        payload,
                        {
                            label: result.input,
                        }
                    );
                }
                break;
            }
            case UpdateAction.COLOR: {
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
                    vscode.window.showErrorMessage("Please choose a color.");
                }
                break;
            }
            case UpdateAction.DESCRIPTION: {
                const result = await showInputBox({
                    prompt: "Enter a description for the group",
                    placeHolder: "Enter a description for the group",
                    value: group?.description,
                });
                if (result.state) {
                    this.applyUpdate(
                        (updatedPayload: any) =>
                            this.treeDataProvider.updateGroup(updatedPayload),
                        payload,
                        {
                            description: result.input,
                        }
                    );
                }
                break;
            }
            default:
                vscode.window.showErrorMessage("Invalid action");
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
            case UpdateAction.LABEL: {
                const result = await showInputBox({
                    prompt: "Enter a name for the tab",
                    placeHolder: "Enter the tab name",
                    value: tab.label,
                });
                if (result.state) {
                    this.applyUpdate(
                        (updatedPayload: any) =>
                            this.treeDataProvider.updateTab(updatedPayload),
                        payload,
                        {
                            label: result.input,
                        }
                    );
                }
                break;
            }
            case UpdateAction.DESCRIPTION:
                {
                    const result = await showInputBox({
                        prompt: "Enter a description for the tab",
                        placeHolder: "Enter the tab description",
                        value: tab?.description,
                    });
                    if (result.state) {
                        this.applyUpdate(
                            (updatedPayload: any) =>
                                this.treeDataProvider.updateTab(updatedPayload),
                            payload,
                            {
                                description: result.input,
                            }
                        );
                    }
                }

                break;
            default:
                vscode.window.showErrorMessage("Invalid action");
                break;
        }
    }

    async handleOpenGroup(group: Group) {
        const nodes = group.getChildren();
        for (const node of nodes) {
            if (node.type === TreeItemType.Tab) {
                await vscode.commands.executeCommand("vscode.open", node.uri);
            }
        }
    }

    async handleFoldGroup() {
        const viewCollapse = this.treeDataProvider.getGlobalState<boolean>(
            STORAGE_KEYS.VIEW_COLLAPSE
        );

        const allGroup = this.treeDataProvider.getGroups() as Group[];
        this.treeDataProvider.setViewCollapsed(allGroup, !viewCollapse);
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

    openNewWorkspace = async (workspaceUri: vscode.Uri) => {
        if (!workspaceUri) {
            vscode.window.showErrorMessage("No workspace found.");
            return;
        }

        // 새로운 워크스페이스 파일 이름 및 경로
        const newWorkspaceFileName = "duplicated_workspace.code-workspace";
        const newWorkspaceFilePath = path.join(
            os.tmpdir(),
            newWorkspaceFileName
        );

        try {
            // 새로 생성된 워크스페이스 파일 경로를 URI로 변환
            const newWorkspaceUri = vscode.Uri.file(newWorkspaceFilePath);

            // 새로 생성된 워크스페이스 열기 (새 창에서 열기)
            await vscode.commands.executeCommand(
                "vscode.openFolder",
                newWorkspaceUri,
                true
            );
            vscode.window.showInformationMessage(
                `Workspace duplicated and opened in new window: ${newWorkspaceUri.fsPath}`
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to duplicate workspace`);
        }
    };

    // 그룹에 속한 탭들을 포함하는 새로운 워크스페이스 생성
    async handleOpenWorkspace(tab: Tab) {
        const workspaceFolder = tab.getWorkspace();
        await this.openNewWorkspace(workspaceFolder);
    }

    // 라인에 게터 아이콘 추가
    async addGutterIcon(
        editor: vscode.TextEditor,
        gutterLineInfo: GetterLineInfo
    ) {
        //const cursorPosition = editor.selection.active; // 커서의 위치
        const line = gutterLineInfo.line; //라인
        const uriStr = gutterLineInfo.uri.toString(); //uri

        //1. 게터 map에서 기존 게터 정보 가져오기
        const existingInfos = this.gutterIconProvider.get(uriStr) || [];

        // 2. 동일한 라인 & 동일한 탭의 정보가 있으면 제거
        const updatedInfos = existingInfos.filter(
            (info) =>
                !(info.tabId === gutterLineInfo.tabId && info.line === line)
        );

        // 3. 새로운 정보 추가
        updatedInfos.push(gutterLineInfo);

        // 4. 게터 아이콘 데이터 업데이트
        this.gutterIconProvider.set(uriStr, updatedInfos);

        // 5. 데코레이션 적용을 위한 range 추출
        const ranges = updatedInfos.map((info) => info.range);

        // 6. 현재 editor에 데코레이션 적용
        editor.setDecorations(
            this.gutterIconProvider.getLineMarkerDecoration(),
            ranges
        );
    }

    //열린 정보로 바로라인 추가하는 기능도있어야함
    async handleSetLine() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const cursorPosition = editor.selection.active;
        const uri = editor.document.uri;
        const line = cursorPosition.line;
        const character = cursorPosition.character;

        const allTabs = this.treeDataProvider.getAllTabs() as Tab[];
        const matchingTabs = allTabs.filter((tab) => tab.path === uri.path);

        let targetTab: Tab | undefined;

        // 1. Tab이 없는 경우 → 그룹 및 탭 생성
        if (matchingTabs.length === 0) {
            const group = await this.handleCreateGroupAndTab([uri]);
            targetTab = (group?.getAllTabs() as Tab[]).find(
                (tab) => tab.path === uri.path
            );
        }

        // 2. Tab이 1개 있는 경우 → 바로 사용
        else if (matchingTabs.length === 1) {
            targetTab = matchingTabs[0];
        }

        // 3. Tab이 여러 개 있는 경우 → 사용자에게 선택 받기
        else {
            const pickItems = matchingTabs.map((tab) => ({
                label: `${tab.getPath()}${tab.getLabel()}`,
                id: tab.id,
            }));

            const selected = await vscode.window.showQuickPick(pickItems, {
                placeHolder: "Choose the tab to attach this line",
            });

            if (selected) {
                targetTab = matchingTabs.find((tab) => tab.id === selected.id);
            }
        }

        if (targetTab) {
            const lineNode = await this.treeDataProvider.setLine({
                tab: targetTab,
                createInfo: { uri, line, character, cursorPosition },
            });

            const lineStart = new vscode.Position(line, 0);
            const lineEnd = new vscode.Position(
                line,
                editor.document.lineAt(line).text.length
            );

            const range = new vscode.Range(lineStart, lineEnd);

            if (lineNode) {
                const gutterLineInfo = {
                    uri: uri,
                    tabId: targetTab.id,
                    line: line,
                    range: range,
                    lineId: lineNode.id,
                };

                await this.addGutterIcon(editor, gutterLineInfo);
            }
        }
    }

    deleteGutterIcon(uriStr: string, tabId: string, line: number) {
        //1. 게터 map에서 기존 게터 정보 가져오기
        const existingInfos = this.gutterIconProvider.get(uriStr) || [];

        // 1. 해당 tabId + line에 해당하는 정보만 제거
        const updatedInfos = existingInfos.filter(
            (info) => !(info.tabId === tabId && info.line === line)
        );

        // 2. 다시 저장
        this.gutterIconProvider.set(uriStr, updatedInfos);

        // 3. 데코레이션 적용
        const editor = vscode.window.visibleTextEditors.find(
            (ed) => ed.document.uri.toString() === uriStr
        );

        if (editor) {
            const updatedRanges = updatedInfos.map((info) => info.range);
            editor.setDecorations(
                this.gutterIconProvider.getLineMarkerDecoration(),
                updatedRanges
            );
        }
    }
    /**
     * 1.라인 제거
     * 2.게터 데코레이션 제거
     * @param node
     */
    async handleDeleteLine(node: any) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const uri = editor.document.uri;
        const line = editor.selection.active.line;
        const uriStr = uri.toString();

        //현재 열려 있는 파일(uri)과 같은 경로를 가진 Tab 전체 가져오기
        const allTabs = this.treeDataProvider.getAllTabs() as Tab[];
        const matchingTabs = allTabs.filter(
            (tab) => tab.uri.toString() === uriStr
        );

        const lineTabs = matchingTabs.filter((tab) => {
            const lines = tab.getLines();
            return lines.some((lineNode) => lineNode.line === line);
        });
        console.log("탭 전체", matchingTabs);

        if (lineTabs.length === 0) return;

        let targetTab: Tab | undefined;

        if (lineTabs.length === 1) {
            targetTab = lineTabs[0];
        } else {
            const pickItems = lineTabs.map((tab) => ({
                label: `${tab.getPath()}${tab.getLabel()} : ${line + 1}`,
                id: tab.id,
            }));

            const selected = await vscode.window.showQuickPick(pickItems, {
                placeHolder: "어떤 탭에서 라인을 삭제할까요?",
            });

            if (selected) {
                targetTab = lineTabs.find((tab) => tab.id === selected.id);
            }
        }

        if (!targetTab) return;

        // Line 제거
        //현재 열려있는 Tab의 line만 지워야함
        this.treeDataProvider.removeLine(targetTab, line);

        // 2. Gutter 데코레이션 제거 (tabId, line 기준)
        this.deleteGutterIcon(uriStr, targetTab.id, line);
    }
}
