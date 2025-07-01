import { TreeItemType } from "../types/types";

import { ICreateGroup } from "../types/group";
import { Node } from "./Node";

export class Tree extends Node {
    private static instance: Tree | null = null;
    readonly type = TreeItemType.Tree;

    private constructor(id: string) {
        super(id);
    }

    public static getInstance(id: string): Tree {
        if (!Tree.instance) {
            Tree.instance = new Tree(id);
        }

        return Tree.instance;
    }

    createGroup(payload: ICreateGroup) {}

    getGroupMap() {}

    resetTree() {}
}
