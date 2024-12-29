import * as vscode from "vscode";

import { Tree } from "../node/Tree";
import { GroupItem, TabItem, TreeItemType } from "../type/types";
import { getNativeTabByTabItemPath, getNormalizedId } from "../util";

import { Group } from "../node/Group";
import { Tab } from "../node/Tab";
import { ICreateGroup } from "../type/group";
import { EventHandler } from "../EventHandler";
import { Node } from "../node/Node";
import { TabView } from "../view/TabView";

export class TreeDataProvider {
    private tree: Tree;
    private view: TabView;

    constructor(view: TabView) {
        this.view = view;
        this.tree = new Tree();
        //
        //this.tree.addEvent("create", () => this.triggerEventRerender());
        //this.tree.addEvent("delete", () => this.triggerEventRerender());
        //this.tree.addEvent("update", () => this.triggerEventRerender());
    }

    public triggerEventRerender() {
        this.view._onDidChangeTreeData.fire();
    }

    getGroups() {
        return this.tree.getAllGroups();
    }

    initialize() {
        this.view.registerCommandHandler("create.group", () =>
            this.addNewGroup()
        );
        this.view.registerCommandHandler("create.tab.new-group", () =>
            this.addNewGroupWithTab()
        );
    }

    async addNewGroup() {
        const inputResult = await this.view.inputGroupPromptInputBox("new");
        if (inputResult.result) {
            const groupInfo = {
                label: inputResult.label,
                parentId: "root",
            };

            this.createGroup(groupInfo);
            this.view.showInformationMessage(
                `그룹 "${inputResult}"이 생성되었습니다.`
            );
        }
    }

    async addNewGroupWithTab() {
        const inputResult = await this.view.inputGroupPromptInputBox("new");
        if (inputResult) {
            const groupInfo = {
                label: inputResult.label,
                parentId: "root",
            };

            //1. 빈 그룹 추가
            const newGroup = this.createGroup(groupInfo);

            //newGroup.add(uri)
            //2. 추가된 그룹 목록 가져오기
            //  const groupMap = this.treeDataProvider.getGroupMap(); // getData로 그룹 리스트 가져오기

            // console.log("그룹 모음", groupMap);

            // vscode.window.showInformationMessage(
            //     `파일 {} 가 그룹 "${selectedColor.label}"에 추가 되었습니다.`
            // );
        }
    }

    createGroup(payload: ICreateGroup) {
        const group = new Group(payload.label, payload.parentId);
        this.tree.add(group);

        this.triggerEventRerender();

        return group;
    }

    getChildren(element?: Group | Tab): Group[] {
        if (element instanceof Tab) {
            return [];
        }

        // todo : 수정
        const target = element ?? this.tree;
        return target.getChildren();
    }

    getTreeItem(element: Group | Tab): vscode.TreeItem {
        //console.log("getTreeItem-->", element);

        const treeItem = element.render(this.view.context);
        //접혔다 펼쳤다 하는 기능
        //this.context에 collapsed를 넣어야할거고, 그걸 통해서 여기서 렌더시칼 때 group에 전부 반영 시켜서 렌더링 시켜줘야할거같음

        return treeItem;
    }
}
