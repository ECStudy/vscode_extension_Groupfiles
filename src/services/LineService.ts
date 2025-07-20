import { CreateFactory } from "../models/CreateFactory";
import { Line } from "../models/Line";
import { Tab } from "../models/Tab";
import { UpdateAction } from "../types/enums";
import { IUpdateLine } from "../types/group";

export class LineService {
    constructor(private treeProvider: any) {}

    async createLine(payload: {
        tab?: Tab; //tab 무조건 있을거임, 있게 바꿔야함
        createInfo: {
            uri: any;
            line: any;
            character: any;
            cursorPosition: any;
        };
    }): Promise<Line | null> {
        const { tab, createInfo } = payload;

        //라인 노드 생성
        const lineNode = await CreateFactory.createLine(createInfo.uri, {
            line: createInfo.line,
        });

        if (lineNode) {
            const updatedLines = tab
                ?.getChildren()
                .filter((child) => child.line !== createInfo.line);

            //동일한 라인있는 경우 필터링 해서 업데이트(중복방지)
            tab?.setChildren(updatedLines);

            //새로운건 맨 뒤에 넣기
            tab?.add(lineNode);
            tab?.setCollapsed(false);
        }

        this.treeProvider.triggerEventRerender();
        return lineNode;
    }

    removeLine(tab: Tab, line: number) {
        tab.removeLineByLineNumber(line);
        this.treeProvider.triggerEventRerender();
    }

    update(payload: IUpdateLine) {
        switch (payload.action) {
            case UpdateAction.LABEL:
                payload?.label && payload.node.setLabel(payload?.label);
                break;
            case UpdateAction.DESCRIPTION:
                payload?.description &&
                    payload.node.setDescription(payload?.description);
                break;
            default:
                break;
        }

        this.treeProvider.triggerEventRerender();
    }
}
