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
    children: TabItem[];
    collapsed: boolean;
};

export type TabItem = {
    readonly type: TreeItemType.Tab;
    groupId: string | null;
    id: string;
    uri?: any;
    path: string;
};

export type NativeTabInput = TabInputText;
