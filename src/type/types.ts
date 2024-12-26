import * as vscode from "vscode";

import { TabInputText } from "vscode";

export const enum TreeItemType {
    Tab,
    Group,
}

export type GroupItem = {
    readonly type: TreeItemType.Group;
    readonly id: string;
    colorId: string;
    label: string;
    children: TabItem | GroupItem;
    collapsed: boolean;
};

export type TabItem = {
    readonly type: TreeItemType.Tab;
    readonly id: string;
    groupId: string | null;
    path: string;
    uri: vscode.Uri;
};

export type NativeTabInput = TabInputText;
type Item = TabItem | GroupItem;
