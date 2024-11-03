import { Tab, Group, TreeItemType } from "../types";

export class TabsData {
    private root: any;

    constructor() {
        this.root;
    }

    setData(data: any) {
        this.root = data;
    }

    getData() {
        return this.root;
    }

	getChildren(element?: Tab | Group): Array<Tab | Group> | null {
		if (!element) {
			return this.root;
		}
		if (element.type === TreeItemType.Tab) {
			return null;
		}
		return element.children;
	}

}
