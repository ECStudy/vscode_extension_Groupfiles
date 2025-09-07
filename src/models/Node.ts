import { constValue } from "../constants";
import { TreeItemType } from "../types/types";
import { createId } from "../utils/util";
import { Tab } from "./Tab";

import { v4 as uuidv4 } from "uuid";

export class Node {
    private children: any[];
    private parentNode?: Node;
    private _id: string;
    private hash: string = "";

    /** 접기/펼기치 collapsed = true : 닫힘 / false : 열림*/
    collapsed: boolean = false;

    constructor(id: string) {
        this.children = [];
        this._id = id; //id 규칙 [0]type∬[1]id∬[2]hash

        this.updateHashInId();
    }

    get id() {
        return this._id + constValue.delimiter + this.hash;
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
        const groups: Node[] = [];

        // 자식이 없으면 빈 배열 반환
        if (this.children.length === 0) {
            return groups;
        }

        this.children.forEach((child) => {
            // Tab 타입인 경우 건너뛰기
            if (child.type === TreeItemType.Tab) {
                return;
            }

            // 현재 노드가 Group이면 결과에 추가
            groups.push(child);

            // 재귀적으로 자식의 그룹들도 수집
            const childGroups = child.getAllGroups();
            groups.push(...childGroups);
        });

        return groups;
    }

    getAllTabs(): Node[] {
        const tabs: Node[] = [];

        // 자식이 없으면 빈 배열 반환
        if (this.children.length === 0) {
            return tabs;
        }

        this.children.forEach((child) => {
            // Line 타입인 경우 건너뛰기
            if (child.type === TreeItemType.Line) {
                return;
            }

            // Tab 타입인 경우 결과에 추가
            if (child.type === TreeItemType.Tab) {
                tabs.push(child);
            }

            // 재귀적으로 자식의 탭들도 수집
            const childTabs = child.getAllTabs();
            tabs.push(...childTabs);
        });

        return tabs;
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

    setCollapsed(collapsed: boolean) {
        this.updateHashInId();
        this.collapsed = collapsed;
    }

    /**
     * id [2]에 있는 update hash 업데이트
     */
    protected updateHashInId() {
        const parts = this._id.split(constValue.delimiter);
        const newHash = uuidv4();

        if (parts.length === 2) {
            // 2개 구간만 있으면 3번째 구간(hash) 추가
            this._id += constValue.delimiter + newHash;
        } else if (parts.length >= 3) {
            // 3개 이상 구간이 있으면 3번째 구간(hash) 교체
            parts[2] = newHash;
            this._id = parts.join(constValue.delimiter);
        }

        this.hash = newHash;
    }

    setUpdateCollapsed(collapsed: boolean) {
        //현재 노드 collapsed 업데이트
        this.setCollapsed(collapsed);
        //부모 노드 collapsed 업데이트
        if (this.parentNode) {
            this.parentNode.setUpdateCollapsed(collapsed);
        }
    }

    /**
     * 부모부터 자식까지 순회하면서, collapsed 가져오기
     */
    setCollapsedUpToDown(collapsed: boolean = false) {
        //
        const children = this.getChildren();
        children.forEach((child) => {
            // 현재 자식 노드의 collapsed 설정 (자식 유무와 관계없이)
            child.setCollapsed(collapsed);

            // 자식이 있으면 재귀적으로 처리
            if (child.getChildren().length > 0) {
                child.setCollapsedUpToDown(collapsed);
            }
        });
    }

    /**
     * 자식부터 부모까지 순회하면서, collapsed 가져오기
     */
    setCollapsedDownToUp(collapsed: boolean = false) {
        this.setCollapsed(collapsed);

        const parent = this.getParentNode();
        if (parent) {
            parent.setCollapsedDownToUp(collapsed);
        }
    }
}
