import { EventHandler } from "../EventHandler";
import { TreeItemType } from "../type/types";
import { Tab } from "./Tab";

export class Node extends EventHandler {
    private children: any[];
    private parentNode?: Node;
    id: string;

    constructor(id: string) {
        super();
        this.children = [];
        this.id = id;
    }

    getChildren() {
        return this.children;
    }

    getParentNode() {
        return this.parentNode;
    }

    add(item: Node) {
        console.log("🍧🍧 item", item);
        console.log("🍧🍧 this", this);
        console.log("🍧🍧 this.children", this.children);
        console.log("🍧🍧 item.parentNode", item.parentNode);

        //이미 부모가 존재하는 경우 부모 제거
        if (item.parentNode) {
            item.parentNode.remove(item);
        }

        this.children.push(item);

        //자식에 node 넣기
        item.setParentNode(this);
    }

    setParentNode(parentNode: Node) {
        this.parentNode = parentNode;
    }

    setChildren(children: any) {
        this.children = children;
    }

    getLabel() {
        return "";
    }

    getPath(): string {
        if (!this.parentNode) {
            return "";
        }
        return this.parentNode.getPath() + "/" + this.parentNode.getLabel();
    }

    remove(item: Node) {}

    reset() {
        this.children = [];
    }

    getAllGroups(): Node[] {
        const items: Node[] = [];
        if (this.children.length === 0) {
            return items;
        }
        this.children.forEach((node) => {
            const target = node as Tab;
            if (target.type === TreeItemType.Tab) {
                return;
            }

            items.push(node);
            items.push(...node.getAllGroups());
        });
        return items;
    }

    
}
