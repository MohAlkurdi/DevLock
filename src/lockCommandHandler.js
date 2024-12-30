const lockCard = require("./adaptiveCards/lockCommandResponse.json");
const { AdaptiveCards } = require("@microsoft/adaptivecards-tools");
const { CardFactory, MessageFactory } = require("botbuilder");

class ResourceLockManager {
    constructor() {
        this.locks = new Map();
    }

    lock(resource, username) {
        if (this.locks.has(resource)) {
            const lockOwner = this.locks.get(resource);
            return {
                resource,
                status: "already Locked",
                username: lockOwner
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
        // First check if resource exists
        if (!this.locks.has(resource)) {
            return {
                resource,
                status: "unlocked",
                username
            };
        }

        const lockOwner = this.locks.get(resource);
        
        // Check ownership
        if (lockOwner === username) {
            this.locks.delete(resource);
            return {
                resource,
                status: "Unlocked",
                username
            };
        }

        // If we get here, someone else owns the lock
        if (force) {
            this.locks.delete(resource);
            return {
                resource,
                status: "forced Unlocked",
                username
            };
        }

        // Someone else owns it and no force flag
        return {
            resource,
            status: `Locked by ${lockOwner}`,
            username: lockOwner
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
