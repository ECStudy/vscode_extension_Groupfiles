import * as vscode from "vscode";

import { Group } from "../node/Group";
import { UpdateAction } from "./enums";
import { Tab } from "../node/Tab";

export enum CREATE_TYPE {
    NEW = "new",
    PREV = "prev",
}

export interface ICreateGroup {
    createType: CREATE_TYPE;

    label?: string;
    uris?: vscode.Uri[];
    group?: Group;
    workspaceUri?: any;
}

export interface IUpdateGroup {
    action: UpdateAction;
    group: Group;
    label?: string;
    color?: string;
    description?: string;
}

export interface IUpdateTab {
    action: UpdateAction;
    label?: string;
    tab: Tab;
    description?: string;
}
