import * as vscode from "vscode";

import { Group } from "../models/Group";
import { UpdateAction } from "./enums";
import { Tab } from "../models/Tab";
import { Line } from "../models/Line";

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
    node: Group;
    label?: string;
    color?: string;
    description?: string;
}

export interface IUpdateTab {
    action: UpdateAction;
    label?: string;
    node: Tab;
    description?: string;
}

export interface IUpdateLine {
    action: UpdateAction;
    label?: string;
    node: Line;
    description?: string;
}
