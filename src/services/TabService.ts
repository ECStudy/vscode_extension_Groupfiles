import { UpdateAction } from "../types/enums";
import { IUpdateTab } from "../types/group";

export class TabService {
    constructor(private treeProvider: any) {}

    updateTab(payload: IUpdateTab) {
        switch (payload.action) {
            case UpdateAction.LABEL:
                payload?.label && payload.tab.setLabel(payload?.label);
                break;
            case UpdateAction.DESCRIPTION:
                payload?.description &&
                    payload.tab.setDescription(payload?.description);
                break;
            default:
                break;
        }

        this.treeProvider.triggerEventRerender();
    }
}
