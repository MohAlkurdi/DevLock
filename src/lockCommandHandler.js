const lockCard = require("./adaptiveCards/lockCommandResponse.json");
const { AdaptiveCards } = require("@microsoft/adaptivecards-tools");
const { CardFactory, MessageFactory } = require("botbuilder");

class ResourceLockManager {
    constructor() {
        this.locks = new Map();
    }

    lock(resource, username) {
        if (this.locks.has(resource)) {
            return {
                resource,
                status: "Locked",
                username: this.locks.get(resource)
            };
        }
        this.locks.set(resource, username);
        return {
            resource,
            status: "Locked",
            username
        };
    }

    unlock(resource, username, force = false) {
        if (!this.locks.has(resource)) {
            return {
                resource,
                status: "not locked",
                username
            };
        }

        const lockOwner = this.locks.get(resource);
        if (lockOwner !== username && !force) {
            return {
                resource,
                status: "Locked",
                username: lockOwner
            };
        }

        this.locks.delete(resource);
        return {
            resource,
            status: force ? "forced Unlocked" : "Unlocked",
            username
        };
    }
}

const lockManager = new ResourceLockManager();

class LockCommandHandler {
    triggerPatterns = ["lock", "unlock"];

    async handleCommandReceived(context, message) {
        console.log(`App received message: ${message.text}`);
        
        const parts = message.text.trim().split(" ");
        const command = parts[0].toLowerCase();
        const resource = parts[1];
        const force = parts.includes("--force");
        const username = context.activity.from.name;

        if (!resource) {
            return MessageFactory.text("Please specify a resource to lock/unlock");
        }

        let result;
        if (command === "lock") {
            result = lockManager.lock(resource, username);
        } else if (command === "unlock") {
            result = lockManager.unlock(resource, username, force);
        }

        const cardJson = AdaptiveCards.declare(lockCard).render(result);
        return MessageFactory.attachment(CardFactory.adaptiveCard(cardJson));
    }
}

module.exports = {
    LockCommandHandler,
};
