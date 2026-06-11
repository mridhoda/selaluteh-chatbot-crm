export function decodeRef(value = '') {
  try {
    return decodeURIComponent(value);
  } catch (err) {
    return value;
  }
}

export function findDatabaseFileMention(text, agent) {
  if (!text || !agent?.database?.length) return null;
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const altText = (match[1] || '').trim();
    const rawRef = (match[2] || '').trim();
    if (!rawRef) continue;
    const decodedRef = decodeRef(rawRef);
    const normalizedTargets = [rawRef, decodedRef].map((val) =>
      (val || '').toLowerCase(),
    );
    const candidate = agent.database.find((file) => {
      const aliases = [file.storedName, file.originalName, file.id]
        .filter(Boolean)
        .map((val) => val.toLowerCase());
      return aliases.some((alias) =>
        normalizedTargets.some(
          (target) => target === alias || target.includes(alias),
        ),
      );
    });
    if (candidate) {
      return { file: candidate, token: match[0], altText };
    }
  }
  return null;
}

export function findUrlFileMention(text) {
  if (!text) return null;

  // Regex to find markdown links or plain URLs ending with file extensions
  // Matches: [Title](url) or just url
  const regex = /(?:\[([^\]]*)\]\((https?:\/\/[^)]+\.(?:pdf|jpg|jpeg|png|mp4|docx|xlsx|pptx))\)|(https?:\/\/[^\s]+\.(?:pdf|jpg|jpeg|png|mp4|docx|xlsx|pptx)))/gi;

  const match = regex.exec(text);
  if (match) {
    // match[2] is url from markdown, match[3] is plain url
    const url = match[2] || match[3];
    const altText = match[1] || '';
    const token = match[0];

    return { url, token, altText };
  }

  return null;
}
