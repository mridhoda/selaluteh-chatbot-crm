export function decodeRef(value = '') {
  try {
    return decodeURIComponent(value);
  } catch (err) {
    return value;
  }
}

export function findDatabaseFileMention(text, agent) {
  if (!text || !agent?.database?.length) return null;

  // Supported formats:
  // ![Menu](menu.jpg)
  // ![{format:image} Menu](menu.jpg)
  // ![{{format:image}} Menu](menu.jpg)
  // ![Menu]({format:image}menu.jpg)
  // !{format:image}[Menu](menu.jpg)
  const regex = /!(?:(?:\{\{?format:(image|sticker|document|file)\}?\})\s*)?\[([^\]]*)\]\(([^)]+)\)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    let explicitFormat = (match[1] || '').trim().toLowerCase();
    let altText = (match[2] || '').trim();
    let rawRef = (match[3] || '').trim();
    if (!rawRef) continue;

    const altFormatMatch = altText.match(/^\{\{?format:(image|sticker|document|file)\}?\}\s*/i);
    if (altFormatMatch) {
      explicitFormat ||= altFormatMatch[1].toLowerCase();
      altText = altText.replace(altFormatMatch[0], '').trim();
    }

    const refFormatMatch = rawRef.match(/^\{\{?format:(image|sticker|document|file)\}?\}\s*/i);
    if (refFormatMatch) {
      explicitFormat ||= refFormatMatch[1].toLowerCase();
      rawRef = rawRef.replace(refFormatMatch[0], '').trim();
    }

    if (explicitFormat === 'file') explicitFormat = 'document';

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
      return { file: candidate, token: match[0], altText, format: explicitFormat || null };
    }
  }
  return null;
}

export function findUrlFileMention(text) {
  if (!text) return null;

  // Regex to find markdown links with optional ! and {format:xx}
  // Matches: ![{format:image} Title](https://...jpg) or https://...jpg
  const regex = /!?(?:(?:\{\{?format:(image|sticker|document|file)\}?\})\s*)?\[([^\]]*)\]\((https?:\/\/[^)]+\.(?:pdf|jpg|jpeg|png|mp4|docx|xlsx|pptx|gif|webp))\)|(https?:\/\/[^\s]+\.(?:pdf|jpg|jpeg|png|mp4|docx|xlsx|pptx|gif|webp))/gi;

  const match = regex.exec(text);
  if (match) {
    let explicitFormat = (match[1] || '').trim().toLowerCase();
    let altText = (match[2] || '').trim();
    let url = match[3] || match[4];
    const token = match[0];

    const altFormatMatch = altText.match(/^\{\{?format:(image|sticker|document|file)\}?\}\s*/i);
    if (altFormatMatch) {
      explicitFormat ||= altFormatMatch[1].toLowerCase();
      altText = altText.replace(altFormatMatch[0], '').trim();
    }

    const refFormatMatch = url.match(/^\{\{?format:(image|sticker|document|file)\}?\}\s*/i);
    if (refFormatMatch) {
      explicitFormat ||= refFormatMatch[1].toLowerCase();
      url = url.replace(refFormatMatch[0], '').trim();
    }

    if (explicitFormat === 'file') explicitFormat = 'document';

    return { url, token, altText, format: explicitFormat || null };
  }

  return null;
}
