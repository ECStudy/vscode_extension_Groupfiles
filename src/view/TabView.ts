import * as vscode from "vscode";

import * as path from "path";
import * as os from "os";
import * as fs from "fs";

import { v4 as uuidv4 } from "uuid";
import { TAB_VIEW } from "../type/enums";

import { CommandManager } from "../command/CommandManager";

import { TreeDataProvider } from "../tab/TreeDataProvider";

import {
    TabViewCloseTab,
    TabViewCreateGroup,
    TabViewCreateTabToGroup,
    TabViewCreateTabToGroupContext,
} from "../type/command";
import { Tab } from "../tab/Tab";
import { GroupItem } from "../type/types";
import { colorPalette } from "../color";

export class TabView extends CommandManager {
    private treeDataProvider: TreeDataProvider;

    constructor(context: vscode.ExtensionContext) {
        super();
        this.treeDataProvider = new TreeDataProvider(context);
        vscode.window.createTreeView(TAB_VIEW, {
            treeDataProvider: this.treeDataProvider,
            canSelectMany: true,
            dragAndDropController: this.treeDataProvider, // Drag & Drop 활성화
        });

        this.registerCommandHandler();
    }

    private registerCommandHandler() {
        //탭 닫기
        vscode.commands.registerCommand(TabViewCloseTab, (tab: Tab) => {
            this.handleCloseTab(tab);
        });

        vscode.commands.registerCommand(TabViewCreateGroup, () => {
            this.handleCreateGroup();
        });

        vscode.commands.registerCommand(
            TabViewCreateTabToGroup,
            (uri: vscode.Uri) => {
                this.handleCreateTabToGroup(uri);
            }
        );

        //context 메뉴 통해서 그룹에 탭 넣기
        vscode.commands.registerCommand(
            TabViewCreateTabToGroupContext,
            (tab: any) => {
                this.handleCreateTabToGroup(tab.uri); // Tab 객체로부터 URI 가져옴
            }
        );

        //새로 그룹 만들고, 탭 넣기
        vscode.commands.registerCommand(
            "tab-and-bookmark.tabview.create.TabToNewGroup",
            (uri: vscode.Uri) => {
                //그룹 생성
                this.handleCreateGroupAndCreateTab(uri);
            }
        );

        //그룹 삭제
        vscode.commands.registerCommand(
            "tab-and-bookmark.tabview.delete.group",
            (groupItem: GroupItem) => {
                //그룹 모두 삭제
                this.handleDeleteGroup(groupItem);
            }
        );

        //그룹 모두 삭제
        vscode.commands.registerCommand(
            "tab-and-bookmark.tabview.delete.allgroup",
            () => {
                //그룹 모두 삭제
                this.handleDeleteAllGroup();
            }
        );

        //그룹 이름 변경
        vscode.commands.registerCommand(
            "tab-and-bookmark.tabview.update.group",
            (groupItem: GroupItem) => {
                //그룹 이름 변경 삭제
                this.handleUpdateGroup(groupItem);
            }
        );

        //그룹 열기 변경
        vscode.commands.registerCommand(
            "tab-and-bookmark.tabview.open.group",
            (groupItem: GroupItem) => {
                //그룹 열기 변경
                this.handleOpenGroup(groupItem);
            }
        );

        //그룹 새로운 워크스페이스로 열기
        vscode.commands.registerCommand(
            "tab-and-bookmark.tabview.open.newWorkSpace",
            (groupItem: GroupItem) => {
                //그룹 열기 변경
                this.handleOpenNewWorkspace(groupItem);
            }
        );

        //전체 그룹 접기
        vscode.commands.registerCommand(
            "tab-and-bookmark.tabview.fold.group",
            () => {
                //전체 그룹 접기
                this.handleFoldGroup(true);
            }
        );

        //전체 그룹 접기
        vscode.commands.registerCommand(
            "tab-and-bookmark.tabview.unfold.group",
            () => {
                //전체 그룹 접기
                this.handleFoldGroup(false);
            }
        );

        //그룹 아이콘 변경
        vscode.commands.registerCommand(
            "tab-and-bookmark.tabview.update.groupicon",
            (groupItem: GroupItem) => {
                //전체 그룹 접기
                this.handleUpdateGroupIcon(groupItem);
            }
        );
    }
    private handleCloseTab(tab: any) {
        vscode.commands.executeCommand(
            "workbench.action.closeActiveEditor",
            tab.uri
        );
        this.treeDataProvider.closeTab(tab);
    }

    async handleCreateGroupAndCreateTab(uri: vscode.Uri) {
        const groupName = await vscode.window.showInputBox({
            prompt: "Enter a name for the new group",
            placeHolder: "새 그룹 이름 추가",
        });

        if (!groupName) {
            vscode.window.showErrorMessage("그룹 이름을 입력해주세요.");
            return;
        }

        this.treeDataProvider.createGroup(groupName);
        const groups = this.treeDataProvider["treeData"].getData(); // getData로 그룹 리스트 가져오기
        const selectedGroup = groups.find((group) => group.label === groupName);
        if (!selectedGroup) {
            vscode.window.showErrorMessage("선택된 그룹을 찾을 수 없습니다.");
            return;
        }

        this.treeDataProvider.createTabToGroup(selectedGroup.id, uri);
    }

    async handleCreateGroup() {
        const groupName = await vscode.window.showInputBox({
            prompt: "Enter a name for the new group",
            placeHolder: "새 그룹 이름 추가",
        });

        if (!groupName) {
            vscode.window.showErrorMessage("그룹 이름을 입력해주세요.");
            return;
        }

        this.treeDataProvider.createGroup(groupName);
        vscode.window.showInformationMessage(
            `그룹 "${groupName}"이 생성되었습니다.`
        );
    }

    async handleCreateTabToGroup(uri: vscode.Uri) {
        // 트리 데이터에서 그룹 가져오기
        const groups = this.treeDataProvider["treeData"].getData(); // getData로 그룹 리스트 가져오기

        if (groups.length === 0) {
            this.handleCreateGroupAndCreateTab(uri);
            return;
        }

        const selectedGroupName = await vscode.window.showQuickPick(
            groups.map((group) => group.label),
            { placeHolder: "탭을 추가할 그룹을 선택하세요." }
        );

        if (!selectedGroupName) {
            vscode.window.showErrorMessage("그룹을 선택하지 않았습니다.");
            return;
        }

        const selectedGroup = groups.find(
            (group) => group.label === selectedGroupName
        );

        if (!selectedGroup) {
            vscode.window.showErrorMessage("선택된 그룹을 찾을 수 없습니다.");
            return;
        }

        try {
            this.treeDataProvider.createTabToGroup(selectedGroup.id, uri);
            vscode.window.showInformationMessage(
                `"${selectedGroup.label}" 그룹에 탭이 추가되었습니다.`
            );
        } catch (error: any) {
            vscode.window.showErrorMessage(
                `탭 추가 중 오류 발생: ${error.message}`
            );
        }
    }

    async handleDeleteGroup(groupItem: GroupItem) {
        const confirm = await vscode.window.showInformationMessage(
            `Do you want to delete "${groupItem.label}" group and files?`,
            "Delete",
            "Cancel"
        );

        if (confirm === "Delete") {
            this.treeDataProvider.deleteGroup(groupItem.id);
            vscode.window.showInformationMessage(
                `"${groupItem.label}" group has been deleted `
            );
        }
    }

    async handleDeleteAllGroup() {
        const confirm = await vscode.window.showInformationMessage(
            `Do you want to delete All group and files?`,
            "Delete",
            "Cancel"
        );

        if (confirm === "Delete") {
            this.treeDataProvider.deleteAllGroup();
        }
    }

    async handleUpdateGroup(groupItem: GroupItem) {
        const groupName = await vscode.window.showInputBox({
            prompt: "Enter a name for the new group",
            placeHolder: "수정할 그룹 이름 입력",
            value: groupItem.label,
        });

        if (!groupName) {
            vscode.window.showErrorMessage("그룹 이름을 입력해주세요.");
            return;
        }

        this.treeDataProvider.updateGroupLabel(groupItem.id, groupName);
    }

    async handleOpenGroup(groupItem: GroupItem) {
        const tabs = groupItem.children; //그룹에 속한 탭 리스트
        for (const tab of tabs) {
            //탭 열기
            await vscode.commands.executeCommand("vscode.open", tab.uri);
        }
    }

    //동작하지 않음
    async handleFoldGroup(isCollapse: boolean) {
        this.treeDataProvider.collapseAllGroups(isCollapse);
    }

    /**
     * 사용자가 "새로운 워크스페이스 열기" 명령을 실행
     *  - 그룹의 파일 목록을 포함한 .code-workspace 파일이 생성
     *  - 해당 파일을 새로운 VS Code 창에서 열도록 명령 실행
     * 새로운 창 활성화 시 openStartupFiles 실행
     *  - 워크스페이스 설정에 저장된 openFilesAtStartup 값을 읽어 파일을 자동으로 열기
     */
    async handleOpenNewWorkspace(groupItem: GroupItem) {
        const tabs = groupItem.children; // 그룹에 속한 탭 리스트

        //1. 임시 워크스페이스 파일 생성
        const workspaceFolder = vscode.Uri.file(
            path.join(os.tmpdir(), `group:${groupItem.label}.code-workspace`)
        );

        // 열려는 파일들의 경로를 워크스페이스 설정에 저장
        const workspaceData = {
            folders: Array.from(
                new Set(tabs.map((tab) => path.dirname(tab.uri.fsPath)))
            ).map((folderPath) => ({ path: folderPath })),
            settings: {
                //워크스페이스가 열릴 때 파일을 자동으로 여는 설정을 저장
                openFilesAtStartup: tabs.map((tab) => tab.uri.fsPath),
            },
        };

        console.log("워크스페이스 데이터", workspaceData);

        //.code-workspace 파일을 새 창 d열기
        fs.writeFileSync(
            workspaceFolder.fsPath,
            JSON.stringify(workspaceData, null, 2)
        );

        // 2. 새로운 창에서 워크스페이스 열기
        await vscode.commands.executeCommand(
            "vscode.openFolder",
            workspaceFolder,
            true // 새 창에서 열기
        );

        //3. 이후 동작
        //익스텐션 실행 후 openStartupFiles 함수가 호출
        //vscode.workspace.getConfiguration().get<string[]>("openFilesAtStartup")를 통해
        //.code-workspace 파일에서 지정된 openFilesAtStartup 설정을 읽기
        //해당 파일 경로를 순회하며 vscode.open 명령어를 사용해 파일을 열기
    }

    async handleUpdateGroupIcon(groupItem: GroupItem) {
        const colorPalette = [
            { label: "red", description: "Red", svg: "🔴" },
            { label: "orange", description: "Orange", svg: "🟠" },
            { label: "yellow", description: "Yellow", svg: "🟡" },
            { label: "green", description: "Green", svg: "🟢" },
            { label: "blue", description: "Blue", svg: "🔵" },
            { label: "purple", description: "Purple", svg: "🟣" },
            { label: "black", description: "Black", svg: "⚫" },
        ];

        const quickPickItems = colorPalette.map((item) => ({
            label: `${item.svg} ${item.description}`,
            description: `Choose ${item.label}`,
            color: item.label, // 색상 키를 전달
        }));

        const selectedColor = await vscode.window.showQuickPick(
            quickPickItems,
            {
                placeHolder: "Choose a color for the group icon",
                canPickMany: false,
            }
        );

        if (selectedColor) {
            this.treeDataProvider.updateGroupIcon(
                groupItem.id,
                selectedColor.color
            );
        }
    }
}
