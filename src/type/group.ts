import * as vscode from "vscode";
import { Node } from "../node/Node";
import { Group } from "../node/Group";
import { UpdateAction } from "./enums";
import { Tab } from "../node/Tab";

export interface ICreateGroup {
    label?: string;
    uri?: vscode.Uri;
    group?: Node;
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
