import { TreeItemType } from "../types/types";
import { Tab } from "./Tab";

export class Node {
    private children: any[];
    private parentNode?: Node;
    id: string;

    constructor(id: string) {
        this.children = [];
        this.id = id;
    }

    getChildren() {
        return this.children;
    }

    getParentNode() {
        return this.parentNode;
    }

    //item이 지금 옮기려고 넣은 item
    add(item: Node, index?: number) {
        //원래 내 부모인가?
        if (this.isMyParent(item)) {
            return;
        }

        //이미 부모가 존재하는 경우 부모 제거
        if (item.parentNode) {
            item.parentNode.remove(item);
        }

        // 인덱스가 유효한 경우 해당 위치에 삽입
        if (index !== undefined && index >= 0 && index < this.children.length) {
            this.children.splice(index, 0, item);
        } else {
            // 기본적으로 맨 뒤에 추가
            this.children.push(item);
        }

        //자식에 node 넣기
        item.setParentNode(this);

        //자식은 부모를 잃었다.
        //
    }

    isMyParent(node: Node): boolean {
        const nodePath = node.getTreePath();
        const selfPath = this.getTreePath();
        if (selfPath.length < nodePath.length) {
            return false;
        }
        if (nodePath === "") {
            return false;
        }
        return new RegExp(`^${nodePath}.*`).test(selfPath);
    }

    setParentNode(parentNode?: Node) {
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
        return this.parentNode.getPath() + this.parentNode.getLabel() + "/";
    }

    remove(item: Node) {
        //children 목록에 item이 존재하지 않으면 return
        if (!this.getChildren().some(({ id }) => id === item.id)) {
            return;
        }
        //제거할 대상을 부모의 children 목록에서 제거
        const removeResult = this.getChildren().filter(
            ({ id }) => id !== item.id
        );
        //제거할 대상을 부모의 children 목록에서 지워주고, children set 해줌
        this.setChildren(removeResult);
        item.setParentNode();
    }

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

    getAllTabs(): Node[] {
        const items: Node[] = [];
        if (this.children.length === 0) {
            return items;
        }
        this.children.forEach((node) => {
            const target = node;

            if (target.type === TreeItemType.Line) {
                return;
            }

            if (target.type === TreeItemType.Tab) {
                items.push(node);
            }

            items.push(...node.getAllTabs());
        });
        return items;
    }

    findPath(treePath: string[] = []) {
        const [id, ...other] = treePath;
        if (!id) {
            return this;
        }
        const child = this.getChildren().find((item) => item.id === id);
        return child.findPath(other);
    }

    getTreePath(): string {
        if (!this.parentNode) {
            return "";
        }
        return this.parentNode.getTreePath() + "/" + this.id;
    }
}
