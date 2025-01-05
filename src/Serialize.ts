import * as vscode from "vscode";

import { Group } from "./node/Group";
import { Tab } from "./node/Tab";
import { Tree } from "./node/Tree";
import { TreeItemType } from "./type/types";

interface NodeJson {
    type: TreeItemType;
    payload: {
        id: string;
        label?: string;
        color?: string;
        collapsed?: boolean;
        path?: string;
        uri?: { path: string; external?: string; fsPath?: string };
    };
    children?: NodeJson[];
}

export class Serialize {
    constructor() {}

    static toJson(tree: Tree) {
        console.log(tree);

        const serializeNode = (
            node: any
        ): { type: TreeItemType; payload: any; children?: any[] } => {
            const json: { type: TreeItemType; payload: any; children?: any[] } =
                {
                    type: node.type, // Node type (Tree, Group, Tab)
                    payload: {
                        id: node.id,
                    },
                } as any;

            if (node.type === TreeItemType.Group) {
                json.payload.label = (node as Group).label;
                json.payload.color = (node as Group).color;
                json.payload.collapsed = (node as Group).collapsed;
            } else if (node.type === TreeItemType.Tab) {
                json.payload.path = (node as Tab).path;
                json.payload.uri = (node as Tab).uri;
            }

            if (node.getChildren().length > 0) {
                json.children = node
                    .getChildren()
                    .map((child: any) => serializeNode(child));
            }

            return json;
        };

        const data = serializeNode(tree);
        return data;
    }

    static fromJson(json: NodeJson) {
        const createNode = (nodeJson: any): Group | Tab | Tree => {
            let node;
            switch (nodeJson.type) {
                case TreeItemType.Tree:
                    node = new Tree(nodeJson.payload.id);
                    break;
                case TreeItemType.Group:
                    node = new Group(
                        nodeJson.payload.id,
                        nodeJson.payload.label
                    );
                    node.setColor(nodeJson.payload.color);
                    node.collapsed = nodeJson.payload.collapsed;
                    break;
                case TreeItemType.Tab:
                    //nodeJson.payload.uri.external : 파일명까지 나옴
                    //nodeJson.payload.uri.fsPath : 파일 경로가 통으로 나옴
                    //nodeJson.payload.uri.path : 파일명까지 나옴
                    const filePath = nodeJson.payload.uri.path;
                    const uri = vscode.Uri.parse(filePath);
                    node = new Tab(nodeJson.payload.id, {
                        input: { uri },
                    });
                    break;
                default:
                    throw new Error(`Unknown node type: ${nodeJson.type}`);
            }
            if (nodeJson.children && nodeJson.children.length > 0) {
                nodeJson.children.forEach((childJson: any) => {
                    const childNode = createNode(childJson);
                    node.add(childNode);
                });
            }
            return node;
        };

        return createNode(json);
    }
}
