const COMPLAINT_WORD_RE = /\b(keluhan|komplain|complaint|laporan)\b/i;
const COMMITMENT_WORD_RE = /\b(catat|dicatat|meneruskan|teruskan|diteruskan|tindak\s*lanjuti|ditindaklanjuti)\b/i;
const ISSUE_WORD_RE = /\b(masalah|pesanan|order|invoice|nomor\s+pesanan|tidak\s+sesuai|salah|bukan|beda|rusak|kecewa|refund)\b/i;

const LABEL_MAP = {
  'nomor pesanan': 'orderNumber',
  invoice: 'orderNumber',
  outlet: 'outlet',
  pesanan: 'orderItems',
  masalah: 'issue',
  kendala: 'issue',
  keluhan: 'issue',
};

const ORDER_NUMBER_RE = /\b(?:nomor\s+pesanan(?:nya)?|invoice|order(?:\s*id)?)\s*(?:adalah|:)?\s*([A-Z0-9][A-Z0-9._/-]{2,})/i;
const OUTLET_RE = /\boutlet\s+([^.,\n]+?)(?=[.,\n]|$)/i;
const ORDER_ITEMS_RE = /\b(?:saya\s+)?pesan\s+(.+?)(?=,?\s+(?:tapi|tetapi|namun|yang\s+saya\s+terima|yang\s+diterima)\b|[.,\n]|$)/i;
const ISSUE_DETAIL_RE = /\b(?:masalah(?:nya)?|kendala(?:nya)?)\s+(.+?)$/i;
const WRONG_ORDER_RE = /\b(tidak\s+sesuai|salah|bukan|beda|rusak|kecewa|refund|belum\s+sampai)\b/i;

function stripMarkdown(value = '') {
  return String(value)
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanExtractedValue(value = '') {
  return stripMarkdown(value).replace(/[.,;:]+$/g, '').trim();
}

function normalizeLabel(label = '') {
  const normalized = stripMarkdown(label).toLowerCase();
  if (LABEL_MAP[normalized]) return LABEL_MAP[normalized];

  return normalized
    .replace(/[^a-z0-9\s]/gi, ' ')
    .trim()
    .split(/\s+/)
    .map((part, index) => (index === 0 ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
    .join('');
}

export function parseComplaintFieldsFromReply(reply = '') {
  const fields = {};
  const lines = String(reply || '').split('\n');

  for (const line of lines) {
    const match = line.match(/^\s*(?:[-*]\s*)?(?:\*\*)?([^:*\n]+?)(?:\*\*)?\s*:\s*(.+?)\s*$/);
    if (!match) continue;

    const key = normalizeLabel(match[1]);
    const value = stripMarkdown(match[2]);
    if (key && value) fields[key] = value;
  }

  return fields;
}

export function parseComplaintFieldsFromText(text = '') {
  const source = stripMarkdown(text);
  const fields = {};
  const orderNumber = source.match(ORDER_NUMBER_RE)?.[1];
  const outlet = source.match(OUTLET_RE)?.[1];
  const orderItems = source.match(ORDER_ITEMS_RE)?.[1];
  const issue = source.match(ISSUE_DETAIL_RE)?.[1];

  if (orderNumber) fields.orderNumber = cleanExtractedValue(orderNumber);
  if (outlet) fields.outlet = cleanExtractedValue(outlet);
  if (orderItems) fields.orderItems = cleanExtractedValue(orderItems);
  if (issue) fields.issue = cleanExtractedValue(issue);
  else if (WRONG_ORDER_RE.test(source)) fields.issue = 'Pesanan tidak sesuai.';

  return fields;
}

function hasEnoughComplaintDetails(text = '') {
  const fields = parseComplaintFieldsFromText(text);
  return Boolean(fields.orderNumber && fields.issue);
}

function summarizeIssue(issue = '') {
  if (/\b(tidak\s+sesuai|salah|bukan|beda)\b/i.test(issue)) return 'Pesanan tidak sesuai';
  if (/\brusak\b/i.test(issue)) return 'Produk rusak';
  if (/\brefund\b/i.test(issue)) return 'Permintaan refund';
  if (/\bbelum\s+sampai\b/i.test(issue)) return 'Pesanan belum sampai';
  return stripMarkdown(issue || 'Keluhan pelanggan').slice(0, 80);
}

export function shouldAutoCreateComplaintFromReply({ reply = '', userText = '' } = {}) {
  if (!reply || reply.includes('FILE_COMPLAINT_JSON:')) return false;

  const combined = `${reply}\n${userText}`;
  const acknowledgedComplaint = (
    COMPLAINT_WORD_RE.test(combined) &&
    COMMITMENT_WORD_RE.test(reply) &&
    ISSUE_WORD_RE.test(combined)
  );
  const customerProvidedCompleteComplaint = hasEnoughComplaintDetails(userText) && ISSUE_WORD_RE.test(combined);

  return acknowledgedComplaint || customerProvidedCompleteComplaint;
}

export function buildAutoComplaintData({ reply = '', userText = '', contact } = {}) {
  const formData = {
    ...parseComplaintFieldsFromText(userText),
    ...parseComplaintFieldsFromReply(reply),
  };
  const issue = formData.issue || stripMarkdown(userText || '').slice(0, 500);
  const issueSummary = summarizeIssue(issue);
  const subjectParts = [issueSummary];
  const details = [];

  if (formData.orderNumber) subjectParts.push(formData.orderNumber);
  if (formData.orderNumber) details.push(`Nomor pesanan: ${formData.orderNumber}`);
  if (formData.outlet) details.push(`Outlet: ${formData.outlet}`);
  if (formData.orderItems) details.push(`Pesanan: ${formData.orderItems}`);
  if (issue) details.push(`Masalah: ${issue}`);

  const description = details.length > 0 ? details.join('\n') : stripMarkdown(reply).slice(0, 500);

  return {
    subject: subjectParts.join(' - ').slice(0, 160),
    text: description,
    description,
    contactName: contact?.name || undefined,
    contactPhone: contact?.phone || contact?.email || undefined,
    priority: WRONG_ORDER_RE.test(`${issue} ${userText}`) ? 'high' : 'medium',
    formData: {
      ...formData,
      source: 'ai_auto_complaint_detection',
    },
  };
}
