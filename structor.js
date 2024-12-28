"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Tab {
    name;
    type;
    constructor(name) {
        if (!name)
            throw new Error("Tab name is required.");
        this.name = name;
        this.type = "tab";
    }
    display(indent = 0) {
        console.log(`${" ".repeat(indent)}📄 ${this.name}`);
    }
}
class Group {
    name;
    type;
    children;
    constructor(name) {
        if (!name)
            throw new Error("Group name is required.");
        this.name = name;
        this.type = "group";
        this.children = [];
    }
    addEventItem(item) {
        if (!(item instanceof Tab || item instanceof Group)) {
            throw new Error("Only tabs or groups can be addEvented.");
        }
        this.children.push(item);
    }
    display(indent = 0) {
        console.log(`${" ".repeat(indent)}📁 ${this.name}`);
        this.children.forEach((item) => item.display(indent + 2));
    }
    findByName(name) {
        if (this.name === name)
            return this;
        for (const child of this.children) {
            if (child instanceof Tab && child.name === name) {
                return child;
            }
            else if (child instanceof Group) {
                const found = child.findByName(name);
                if (found)
                    return found;
            }
        }
        return null;
    }
}
class Tree {
    root;
    constructor(rootName) {
        this.root = new Group(rootName);
    }
    addEventEmptyGroup(groupName, newGroupName) {
        const group = this.root.findByName(groupName);
        if (group instanceof Group) {
            group.addEventItem(new Group(newGroupName));
            return true;
        }
        else {
            console.error(`Group "${groupName}" not found or is not a group.`);
            return false;
        }
    }
    addEventItemToGroup(groupName, item) {
        const group = this.root.findByName(groupName);
        if (group instanceof Group) {
            group.addEventItem(item);
            return true;
        }
        else {
            console.error(`Group "${groupName}" not found or is not a group.`);
            return false;
        }
    }
    findItem(name) {
        return this.root.findByName(name);
    }
    display() {
        this.root.display();
    }
}
class TreeDataProvider {
    trees;
    constructor() {
        this.trees = new Map();
    }
    // addEvent a new tree
    addEventTree(treeName) {
        if (this.trees.has(treeName)) {
            throw new Error(`Tree with name "${treeName}" already exists.`);
        }
        const tree = new Tree(treeName);
        this.trees.set(treeName, tree);
        return tree;
    }
    // Get a tree by name
    getTree(treeName) {
        return this.trees.get(treeName) || null;
    }
    // Delete a tree by name
    deleteTree(treeName) {
        return this.trees.delete(treeName);
    }
    // Display all trees
    displayAllTrees() {
        this.trees.forEach((tree, name) => {
            console.log(`Tree: ${name}`);
            tree.display();
        });
    }
}
// Example usage:
const dataProvider = new TreeDataProvider();
// addEvent trees
const tree1 = dataProvider.addEventTree("Tree1");
const tree2 = dataProvider.addEventTree("Tree2");
// addEvent items to Tree1
tree1.addEventEmptyGroup("Tree1", "Group1");
tree1.addEventItemToGroup("Group1", new Tab("Tab1"));
// addEvent items to Tree2
tree2.addEventEmptyGroup("Tree2", "GroupA");
tree2.addEventItemToGroup("GroupA", new Tab("TabA"));
// Display all trees
dataProvider.displayAllTrees();
// Access specific tree
const specificTree = dataProvider.getTree("Tree1");
if (specificTree) {
    specificTree.display();
}
// Delete a tree
dataProvider.deleteTree("Tree1");
// Display all trees after deletion
dataProvider.displayAllTrees();
//# sourceMappingURL=structor.js.map