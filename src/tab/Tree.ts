import * as vscode from "vscode";

import { GroupItem, TabItem } from "../type/types";

import { Group } from "./Group";
import { Tab } from "./Tab";

export class Tree {
    private root: Array<Group> = [];
    private tabMap: Record<string, TabItem> = {};
    private groupMap: Record<string, Group> = {};
}
