import * as vscode from "vscode";

import { v4 as uuidv4 } from "uuid";
import { TAB_VIEW } from "../type/enums";

import { CommandManager } from "../command/CommandManager";

import { TreeDataProvider } from "../tab/TreeDataProvider";
import { getNativeTabs, getNormalizedId } from "../util";
import {
    GroupItem,
    NativeTabInput,
    TabItem,
    TreeItemType,
} from "../type/types";

export class TabView extends CommandManager {
    private treeDataProvider: TreeDataProvider = new TreeDataProvider();

    constructor() {
        super();

        //1. 열려있는 tabItem 정보 가져오기
        const activeTabItem = this.getinitializeTabItems();

        //2. tabItems 저장
        this.treeDataProvider.setData(activeTabItem);

        //트리 뷰 생성
        vscode.window.createTreeView(TAB_VIEW, {
            treeDataProvider: this.treeDataProvider,
            canSelectMany: true,
        });

        this.registerCommandHandler();
    }

    private registerCommandHandler() {}

    getinitializeTabItems(): Array<TabItem> {
        //native tab 가져옴
        const nativeTabs = getNativeTabs();
        //native tab으로 tabItems 생성
        return this.generateTabItems(nativeTabs);
    }

    generateTabItems(nativeTabs: vscode.Tab[]) {
        const tabItems: Array<TabItem> = [];

        nativeTabs.forEach((nativeTab: vscode.Tab) => {
            const tabItemId = getNormalizedId(nativeTab);

            const nativeTabInput = nativeTab.input as NativeTabInput;
            if (nativeTabInput) {
                const tabItem = {
                    type: TreeItemType.Tab,
                    groupId: null,
                    id: tabItemId,
                    uri: nativeTabInput?.uri,
                } as TabItem;

                tabItems.push(tabItem);
            }
        });
        return tabItems;
    }
}

//nativeTabs
//tabItem
//tabsItem
