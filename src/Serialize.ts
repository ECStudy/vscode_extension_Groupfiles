import * as vscode from "vscode";

import { Group } from "./node/Group";
import { Tab } from "./node/Tab";
import { Tree } from "./node/Tree";
import { TreeItemType } from "./type/types";

export class Serialize {
    constructor() {}

    static toJson(tree: any) {
        console.log(tree);

        const serializeNode = (node: any) => {
            const json = {
                type: node.type, // Node type (Tree, Group, Tab)
                payload: {
                    id: node.id,
                },
            } as any;

            if (node.type === TreeItemType.Group) {
                json.payload.label = node.label;
                json.payload.color = node.color;
                json.payload.collapsed = node.collapsed;
            } else if (node.type === TreeItemType.Tab) {
                json.payload.path = node.path;
                json.payload.uri = node.uri;
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

    static fromJson(json: any) {
        const createNode = (nodeJson: any) => {
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
