import * as vscode from "vscode";
import { TabView } from "../view/views/TabView";
import { Command } from "../types/command";
import { Group } from "../node/Group";
import { Tab } from "../node/Tab";
import { UpdateAction } from "../types/enums";

export const registerTabViewCommands = (tabView: TabView) => {
    //#region 생성 --------------------------------
    //Group 추가
    vscode.commands.registerCommand(Command.CREATE_GROUP, () => {
        tabView.handleCreateGroup();
    });

    //Group 추가 + Tab 추가
    vscode.commands.registerCommand(
        Command.CREATE_GROUP_TAB,
        async (uri: vscode.Uri, selectedUris: vscode.Uri[]) => {
            //단축키 추가
            if (!uri && !selectedUris) {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    await tabView.handleCreateGroupAndTab([
                        editor.document.uri,
                    ]);
                }
                return;
            }

            const uris = selectedUris?.length ? selectedUris : [uri];
            await tabView.handleCreateGroupAndTab(uris);
        }
    );

    //그룹에서 그룹 추가
    vscode.commands.registerCommand(
        Command.CREATE_GROUP_GROUP,
        (group: Group) => {
            tabView.handleCreateGroupAndGroup(group);
        }
    );
    //#endregion 생성 끝

    //#region 제거 --------------------------------
    //모든 그룹 삭제
    vscode.commands.registerCommand(Command.DELET_All, () => {
        //그룹 모두 삭제
        tabView.handleDeleteAll();
    });

    //그룹 제거
    vscode.commands.registerCommand(Command.DELETE_GROUP, (node: Group) => {
        tabView.handleDelete(node);
    });

    //그룹에 있는 탭 제거
    vscode.commands.registerCommand(Command.DELET_TAB, (node: Tab) => {
        tabView.handleDelete(node);
    });
    //#endregion 제거 끝

    //#region 업데이트 --------------------------------
    //그룹 라벨
    vscode.commands.registerCommand(
        Command.UPDATE_GROUP_LABEL,
        (group: Group) => {
            tabView.handleUpdateGroup(group, UpdateAction.LABEL);
        }
    );

    //그룹 아이콘
    vscode.commands.registerCommand(
        Command.UPDATE_GROUP_COLOR,
        (group: Group) => {
            tabView.handleUpdateGroup(group, UpdateAction.COLOR);
        }
    );

    //그룹 주석
    vscode.commands.registerCommand(
        Command.UPDATE_GROUP_DESCRIPTION,
        (group: Group) => {
            tabView.handleUpdateGroup(group, UpdateAction.DESCRIPTION);
        }
    );

    //탭 라벨
    vscode.commands.registerCommand(Command.UPDATE_TAB_LABEL, (tab) => {
        tabView.handleUpdateTab(tab, UpdateAction.LABEL);
    });

    //탭 주석
    vscode.commands.registerCommand(Command.UPDATE_TAB_DESCRIPTION, (tab) => {
        tabView.handleUpdateTab(tab, UpdateAction.DESCRIPTION);
    });

    //저장시점 워크스페이스 열기
    vscode.commands.registerCommand(Command.OPEN_TAB_WORKSPACE, (tab) => {
        tabView.handleOpenWorkspace(tab);
    });

    //#endregion 업데이트 끝

    //#region 열기 --------------------------------
    //그룹에 있는 탭 열기
    vscode.commands.registerCommand("open.group", (group: Group) => {
        tabView.handleOpenGroup(group);
    });

    //#endregion 열기 끝

    vscode.commands.registerCommand("create.tab.line", (node: any) => {
        tabView.handleSetLine(node);
    });
};
