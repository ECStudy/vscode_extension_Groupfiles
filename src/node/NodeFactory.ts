import * as vscode from "vscode";
import { v4 as uuidv4 } from "uuid";

import { Group } from "../node/Group";
import { Tab } from "../node/Tab";

import { parseGitGraphUri } from "../utils/util";

export class NodeFactory {
    static createGroup(label: string, payload?: any): Group {
        const id = `group_${uuidv4()}`;
        return new Group(id, label, payload);
    }

    static async createTab(
        uri: vscode.Uri,
        payload?: any
    ): Promise<Tab | null> {
        if (uri.scheme === "git-graph") {
            const { filePath, metadata } = parseGitGraphUri(uri);
            const nativeTab: vscode.Tab = {
                input: { uri },
                label: filePath.split("/").pop() || "Unknown", // 파일명만 가져오기
            } as vscode.Tab;

            //@TODO 임시로 tabCreatePayload 나누기
            //label 관련 페이로드 정리 필요함
            const tabCreatePayload = {
                workspaceUri: payload.workspaceUri,
            };

            return new Tab(`tab_${uuidv4()}`, nativeTab, tabCreatePayload);
        } else {
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.type === vscode.FileType.File) {
                const nativeTab: vscode.Tab = {
                    input: { uri },
                    label: uri.path.split("/").pop() || "Unknown",
                } as vscode.Tab;

                const tabCreatePayload = {
                    workspaceUri: payload.workspaceUri,
                };

                return new Tab(`tab_${uuidv4()}`, nativeTab, tabCreatePayload);
            }
        }

        return null;
    }
}
