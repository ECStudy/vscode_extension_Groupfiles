import * as vscode from "vscode";

import { GroupItem, TabItem } from "../type/types";

import { Group } from "./Group";
import { Tab } from "./Tab";
import { ICreateGroup } from "../type/group";
import { Node } from "./Node";

export class Tree extends Node {
    //private root: Array<Group> = [];
    private tabMap: Record<string, TabItem> = {};
    private groupMap: Record<string, Group> = {};

    getTree() {
        //return this.root;
    }

    createGroup(payload: ICreateGroup) {}

    getGroupMap() {}
}
