import { STORAGE_KEYS, StoreageManager } from "../store/StorageManager";

export class TreeViewStateService {
    private storageManager: StoreageManager;

    private viewCollapse = false;
    private viewDescription = true;
    private viewAlias = true;

    constructor(
        private triggerEvent: () => void,
        storageManager: StoreageManager
    ) {
        this.storageManager = storageManager;
    }

    initialize() {
        const collapse = this.storageManager.get<boolean>(
            STORAGE_KEYS.VIEW_COLLAPSE
        );
        const desc = this.storageManager.get<boolean>(
            STORAGE_KEYS.VIEW_DESCRIPTION
        );
        const alias = this.storageManager.get<boolean>(STORAGE_KEYS.VIEW_ALIAS);

        this.viewCollapse = collapse ?? false;
        this.viewDescription = desc ?? true;
        this.viewAlias = alias ?? true;
    }

    getCollapse() {
        return this.viewCollapse;
    }

    getDescription() {
        return this.viewDescription;
    }

    getAlias() {
        return this.viewAlias;
    }

    setCollapse(state: boolean) {
        this.viewCollapse = state;
        this.storageManager.set(STORAGE_KEYS.VIEW_COLLAPSE, state);
    }

    setDescription(state: boolean) {
        this.viewDescription = state;
        this.storageManager.set(STORAGE_KEYS.VIEW_DESCRIPTION, state);
        this.triggerEvent();
    }

    setAlias(state: boolean) {
        this.viewAlias = state;
        this.storageManager.set(STORAGE_KEYS.VIEW_ALIAS, state);
        this.triggerEvent();
    }
}
