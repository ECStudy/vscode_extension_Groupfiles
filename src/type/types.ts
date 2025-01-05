import * as vscode from "vscode";

import { TabInputText } from "vscode";

export const enum TreeItemType {
    Tree,
    Tab,
    Group,
}

export type GroupItem = {
    readonly type: TreeItemType.Group;
    readonly id: string;
    color: string;
    label: string;
    children: TabItem | GroupItem;
    collapsed: boolean;
};

export type TabItem = {
    readonly type: TreeItemType.Tab;
    readonly id: string;
    path: string;
    uri: vscode.Uri;
};

export type NativeTabInput = TabInputText;
type Item = TabItem | GroupItem;
