import { UpdateAction } from "../types/enums";
import { IUpdateTab } from "../types/group";

export class TabService {
    constructor(private treeProvider: any) {}

    update(payload: IUpdateTab) {
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
