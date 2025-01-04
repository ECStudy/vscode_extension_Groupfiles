import { EventHandler } from "../EventHandler";
import { TreeItemType } from "../type/types";
import { Tab } from "./Tab";

export class Node extends EventHandler {
    private children: any[];
    private parentNode?: Node;
    id: string;
    extraData: { [key: string]: any }; // 추가 데이터 저장

    constructor(id: string) {
        super();
        this.children = [];
        this.id = id;
        this.extraData = {};
    }

    setExtraData(data: { [key: string]: any }) {
        this.extraData = { ...this.extraData, ...data };
    }

    getChildren() {
        return this.children;
    }

    getParentNode() {
        return this.parentNode;
    }

    add(item: Node) {
        //이미 부모가 존재하는 경우 부모 제거
        if (item.parentNode) {
            item.parentNode.remove(item);
        }
        //자식에 node 넣기
        item.setParentNode(this);
        this.children.push(item);
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
