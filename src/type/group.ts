import * as vscode from "vscode";
import { Node } from "../node/Node";
import { Group } from "../node/Group";
import { UpdateAction } from "./enums";
import { Tab } from "../node/Tab";

export enum CREATE_TYPE {
    NEW = "new",
    PREV = "prev",
}

export interface ICreateGroup {
    label?: string;
    uris?: vscode.Uri[];
    group?: Group;
    type: CREATE_TYPE;
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
