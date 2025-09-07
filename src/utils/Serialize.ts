import * as vscode from "vscode";

import { Group } from "../models/Group";
import { Tab } from "../models/Tab";
import { Tree } from "../models/Tree";

import { TreeItemType } from "../types/types";
import { Line } from "../models/Line";

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
        const serializeNode = (
            node: any
        ): { type: TreeItemType; payload: any; children?: any[] } => {
            const json: { type: TreeItemType; payload: any; children?: any[] } =
                {
                    type: node.type, // Node type (Tree, Group, Tab)
                    payload: {
                        id: node.id,
                        parentNodeId: node?.parentNode?.id,
                    },
                } as any;

            if (node.type === TreeItemType.Group) {
                json.payload.label = (node as Group).label;
                json.payload.color = (node as Group).color;
                json.payload.collapsed = (node as Group).collapsed;
                json.payload.description = (node as Group).description;
            } else if (node.type === TreeItemType.Tab) {
                json.payload.path = (node as Tab).path;
                json.payload.uri = (node as Tab).uri;
                json.payload.workspaceUri = (node as Tab)?.workspaceUri;
                json.payload.label = (node as Tab).label;
                json.payload.description = (node as Tab).description;
            } else if (node.type === TreeItemType.Line) {
                json.payload.path = (node as Line)?.path;
                json.payload.uri = (node as Line)?.uri;
                json.payload.lineText = (node as Line)?.lineText;
                json.payload.line = (node as Line)?.line;
                json.payload.label = (node as Line)?.label;
                json.payload.description = (node as Line)?.description;
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

    static fromJson(json: string, tree: Tree) {
        const createNode = (nodeJson: any): Group | Tab | Line | Tree => {
            let node;
            switch (nodeJson.type) {
                case TreeItemType.Tree:
                    //provider에서 생성해준 tree 주입
                    node = tree;
                    break;
                case TreeItemType.Group:
                    node = new Group(nodeJson.payload);
                    node.setColor(nodeJson.payload.color);
                    node.collapsed = nodeJson.payload.collapsed;
                    node.description = nodeJson.payload.description;

                    break;
                case TreeItemType.Tab:
                    //nodeJson.payload.uri.external : 파일명까지 나옴
                    //nodeJson.payload.uri.fsPath : 파일 경로가 통으로 나옴
                    //nodeJson.payload.uri.path : 파일명까지 나옴
                    const filePath = nodeJson.payload.uri.path;
                    const uri = vscode.Uri.parse(filePath);

                    const woirkspacePath =
                        nodeJson?.payload?.workspaceUri?.path;
                    let workspaceUri = vscode.Uri.parse(woirkspacePath);

                    if (nodeJson?.payload?.workspaceUri?.path) {
                        workspaceUri = vscode.Uri.parse(
                            nodeJson.payload.workspaceUri.path
                        );
                    }

                    node = new Tab({
                        id: nodeJson.payload.id,
                        nativeTab: {
                            input: { uri },
                        },
                        payload: {
                            label: nodeJson?.payload?.label,
                            description: nodeJson?.payload?.description,
                            workspaceUri: workspaceUri, // 복구
                        },
                    });
                    break;
                case TreeItemType.Line:
                    //nodeJson.payload.uri.external : 파일명까지 나옴
                    //nodeJson.payload.uri.fsPath : 파일 경로가 통으로 나옴
                    //nodeJson.payload.uri.path : 파일명까지 나옴

                    const lineUri = vscode.Uri.parse(
                        nodeJson.payload?.uri?.path
                    );

                    node = new Line({
                        id: nodeJson.payload.id,
                        nativeTab: {
                            input: { uri: lineUri },
                        },
                        payload: {
                            line: nodeJson?.payload?.line,
                            label: nodeJson?.payload?.label,
                            lineText: nodeJson?.payload?.lineText,
                            description: nodeJson?.payload?.description,
                        },
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
