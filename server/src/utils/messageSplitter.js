/**
 * Split a long message into multiple bubbles based on paragraphs
 * @param {String} text - The text to split
 * @param {Number} maxLength - Max length per bubble (optional, default 4096 for Telegram)
 * @returns {Array<String>} - Array of message bubbles
 */
export function splitMessage(text, maxLength = 4096) {
    if (!text) return [];

    // Split by double newlines (paragraphs) to create separate bubbles
    // This creates a "chatty" feel with multiple bubbles
    const paragraphs = text.split(/\n\n+/);
    const bubbles = [];

    for (const para of paragraphs) {
        const trimmedPara = para.trim();
        if (!trimmedPara) continue;

        // If paragraph itself is too long, split it by single newlines or chunks
        if (trimmedPara.length > maxLength) {
            // Try splitting by single newline first
            const lines = trimmedPara.split('\n');
            let currentChunk = '';

            for (const line of lines) {
                if (currentChunk.length + line.length + 1 > maxLength) {
                    if (currentChunk) bubbles.push(currentChunk.trim());
                    currentChunk = line;
                } else {
                    currentChunk += (currentChunk ? '\n' : '') + line;
                }
            }
            if (currentChunk) bubbles.push(currentChunk.trim());
        } else {
            // Paragraph fits in one bubble
            bubbles.push(trimmedPara);
        }
    }

    return bubbles;
}
