import * as vscode from "vscode";

import { CreateFactory } from "../models/CreateFactory";
import { Group } from "../models/Group";
import { CREATE_TYPE, ICreateGroup, IUpdateGroup } from "../types/group";
import { UpdateAction } from "../types/enums";

export class GroupService {
    constructor(private treeProvider: any) {}

    private async createTabForGroup(
        group: Group,
        uri: vscode.Uri,
        payload: any
    ) {
        const tab = await CreateFactory.createTab(uri, payload);
        if (tab) {
            group.add(tab);
            group.setUpdateCollapsed(false);
            group?.setCollapsedDownToUp(false);
        }
        this.treeProvider.triggerEventRerender();
    }

    /**
     * 신규 그룹 생성
     * @param payload
     * @returns
     */
    async createGroup(payload: ICreateGroup) {
        let newGroup;
        //그룹 신규 생성
        if (payload.createType === CREATE_TYPE.NEW) {
            //그룹 생성
            if (payload?.label) {
                const group = CreateFactory.createGroup(payload.label);
                const tree = this.treeProvider.getTree();
                tree.add(group);

                //탭 있는 경우 탭 생성
                if (payload?.uris) {
                    for (const uri of payload.uris || []) {
                        await this.createTabForGroup(group, uri, payload);
                    }
                }

                newGroup = group;
            }
        }

        //그룹이 이미 있는 경우
        else if (payload.createType === CREATE_TYPE.PREV) {
            if (payload?.group && payload?.uris) {
                const group = payload?.group;
                for (const uri of payload.uris || []) {
                    await this.createTabForGroup(group, uri, payload);
                }
                newGroup = group;
            }
        }

        newGroup?.setCollapsedDownToUp(false);
        this.treeProvider.triggerEventRerender();
        return newGroup;
    }

    /**
     * 그룹에서 그룹 생성
     * @param payload
     */
    createGroupAndGroup(payload: ICreateGroup) {
        if (payload?.label) {
            const group = CreateFactory.createGroup(payload.label);
            payload?.group?.add(group);
            group?.setCollapsedDownToUp(false);
            this.treeProvider.triggerEventRerender();
        }
    }

    update(payload: IUpdateGroup) {
        switch (payload.action) {
            case UpdateAction.LABEL:
                payload?.label && payload.node.setLabel(payload?.label);
                break;
            case UpdateAction.COLOR:
                payload?.color && payload.node.setColor(payload?.color);
                break;
            case UpdateAction.DESCRIPTION:
                payload?.description &&
                    payload.node.setDescription(payload?.description);
                break;
            default:
                break;
        }
        this.treeProvider.triggerEventRerender();
    }
}
