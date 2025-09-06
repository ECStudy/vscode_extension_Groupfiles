import { STORAGE_KEYS, StoreageManager } from "../store/StorageManager";

export class TreeViewStateService {
    private storageManager: StoreageManager;

    private viewCollapsed = false;
    private viewDescription = true;
    private viewAlias = true;

    constructor(
        private triggerEvent: () => void,
        storageManager: StoreageManager
    ) {
        this.storageManager = storageManager;
    }

    initialize() {
        const collapsed = this.storageManager.get<boolean>(
            STORAGE_KEYS.VIEW_COLLAPSED
        );
        const desc = this.storageManager.get<boolean>(
            STORAGE_KEYS.VIEW_DESCRIPTION
        );
        const alias = this.storageManager.get<boolean>(STORAGE_KEYS.VIEW_ALIAS);

        this.viewCollapsed = collapsed ?? false;
        this.viewDescription = desc ?? true;
        this.viewAlias = alias ?? true;
    }

    getCollapsed() {
        return this.viewCollapsed;
    }

    getDescription() {
        return this.viewDescription;
    }

    getAlias() {
        return this.viewAlias;
    }

    setCollapsed(state: boolean) {
        this.viewCollapsed = state;
        this.storageManager.set(STORAGE_KEYS.VIEW_COLLAPSED, state);
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
