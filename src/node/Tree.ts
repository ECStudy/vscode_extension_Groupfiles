import { TreeItemType } from "../types/types";

import { ICreateGroup } from "../types/group";
import { Node } from "./Node";

export class Tree extends Node {
    readonly type = TreeItemType.Tree;
    id: string;

    constructor(id: string) {
        super(id);
        this.id = id;
    }

    createGroup(payload: ICreateGroup) {}

    getGroupMap() {}

    resetTree() {}
}
