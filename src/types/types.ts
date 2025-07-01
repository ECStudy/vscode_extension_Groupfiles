import * as vscode from "vscode";

import { TabInputText } from "vscode";

export const enum TreeItemType {
    Tree, //0
    Tab, //1
    Group, //2
    Line, //3
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

export interface RenderPayload {
    viewDescription?: boolean;
    viewAlias?: boolean;
}

export type GetterLineInfo = {
    uri: vscode.Uri;
    tabId: string;
    lineId: string;
    line: number;
    range: vscode.Range;
};

export type FileUriString = string;
export type GutterDecorationMap = Map<FileUriString, GetterLineInfo[]>;
