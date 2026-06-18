// Message buffer system for AI time delay feature
// Stores incoming messages and delays AI responses

const messageBuffers = new Map();
// Structure: chatId -> { messages: [], timer: timeoutId, agent, chat, platform }

/**
 * Add a message to the buffer and reset the timer
 * @param {Object} chat - Chat record
 * @param {String} messageText - Message text
 * @param {Object} agent - Agent record
 * @param {Object} platform - Platform record
 * @param {Function} processCallback - Function to call when timer fires
 */
export function bufferMessage(chat, messageText, agent, platform, processCallback) {
    const chatId = chat.id.toString();

    // Clear existing timer if any
    if (messageBuffers.has(chatId)) {
        const buffer = messageBuffers.get(chatId);
        clearTimeout(buffer.timer);
    }

    // Get or create buffer
    const buffer = messageBuffers.get(chatId) || { messages: [], agent, chat, platform };
    buffer.messages.push(messageText);

    // Set new timer based on agent's responseDelay
    const delayMs = (agent.responseDelay || 0) * 1000;

    if (delayMs > 0) {
        buffer.timer = setTimeout(() => {
            processCallback(chatId);
        }, delayMs);

        messageBuffers.set(chatId, buffer);
        return true; // Message buffered
    } else {
        // No delay, process immediately
        return false; // Not buffered, process normally
    }
}

/**
 * Get and remove buffered messages for a chat
 * @param {String} chatId - Chat ID
 * @returns {Object} - { messages: [], agent, chat, platform } or null
 */
export function getAndClearBuffer(chatId) {
    const buffer = messageBuffers.get(chatId);
    if (!buffer) return null;

    // Clear timer and remove from buffer
    if (buffer.timer) {
        clearTimeout(buffer.timer);
    }
    messageBuffers.delete(chatId);

    return buffer;
}

/**
 * Clear buffer for a chat (e.g., when human takes over)
 * @param {String} chatId - Chat ID
 */
export function clearBuffer(chatId) {
    const buffer = messageBuffers.get(chatId);
    if (buffer && buffer.timer) {
        clearTimeout(buffer.timer);
    }
    messageBuffers.delete(chatId);
}

/**
 * Check if a chat has buffered messages
 * @param {String} chatId - Chat ID
 * @returns {Boolean}
 */
export function hasBuffer(chatId) {
    return messageBuffers.has(chatId);
}
