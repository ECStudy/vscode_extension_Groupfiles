export class EventHandler {
    private eventMap: any;

    constructor() {
        this.eventMap = new Map();
    }

    addEvent(eventName: string, callback: Function) {
        this.eventMap.set(eventName, callback);
    }

    removeEvent(eventName: string, callback: Function) {
        this.eventMap.delete(eventName);
    }

    triggerEvent(eventName: string, ...args: unknown[]) {
        const callback = this.eventMap.get(eventName);
        callback();
    }
}
