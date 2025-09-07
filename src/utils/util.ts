import * as vscode from "vscode";
import { TreeItemType } from "../types/types";
import { constValue } from "../constants";

export const getFileName = (path: string) => {
    return path.substring(path.lastIndexOf("/") + 1);
};

import { v4 as uuidv4 } from "uuid";

export const showInputBox = async ({
    prompt,
    placeHolder,
    value,
    errorMessage,
}: {
    prompt: string;
    placeHolder: string;
    value?: string;
    errorMessage?: string;
}): Promise<{ input: string; state: boolean }> => {
    const input = await vscode.window.showInputBox({
        prompt,
        placeHolder,
        value,
    });

    if (!input) {
        if (errorMessage) {
            vscode.window.showErrorMessage(errorMessage);
        }

        return { input: "", state: false };
    }

    return { input, state: true };
};

// Git-graph URI 파싱 함수
export const parseGitGraphUri = (uri: vscode.Uri) => {
    const { query, path } = uri;
    // query는 Base64로 인코딩된 JSON 문자열
    const decodedQuery = Buffer.from(query, "base64").toString("utf-8");
    const metadata = JSON.parse(decodedQuery);

    // Git-graph에서 필요한 파일 경로와 메타데이터를 추출
    const filePath = path; // /file.ts
    const fileMetadata = metadata; // Git 관련 메타데이터

    return {
        filePath,
        metadata: fileMetadata,
    };
};

/**
 * node id 생성 규칙 [0]type∬[1]id∬[2]hash
 * @param type
 * @returns
 */
export const createId = (type: TreeItemType): string => {
    return `${type}${constValue.delimiter}${uuidv4()}`;
};
