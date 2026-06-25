import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAutoComplaintData,
  parseComplaintFieldsFromReply,
  parseComplaintFieldsFromText,
  shouldAutoCreateComplaintFromReply,
} from '../../../src/services/complaint-autocreate.service.js';

describe('complaint auto-create fallback', () => {
  const reply = `Maaf, Mridhoda, atas ketidaknyamanannya. Tea catat ya keluhannya:

**Nomor Pesanan:** INV-TEST-001  
**Outlet:** Selalu Teh Danau Murung  
**Pesanan:** Teh Asli 5 pcs  
**Masalah:** Pesanan yang diterima tidak sesuai.

Tea akan meneruskan laporan ini ke tim outlet terkait agar segera ditindaklanjuti.`;

  it('detects acknowledged complaint replies even without FILE_COMPLAINT_JSON marker', () => {
    assert.equal(shouldAutoCreateComplaintFromReply({
      reply,
      userText: 'Nomor pesanannya INV-TEST-001. Saya sudah checkout dan bayar.',
    }), true);
  });

  it('does not run when explicit marker is already present', () => {
    assert.equal(shouldAutoCreateComplaintFromReply({
      reply: `FILE_COMPLAINT_JSON: {"text":"Pesanan salah"}\n${reply}`,
      userText: 'Pesanan saya salah',
    }), false);
  });

  it('extracts structured complaint fields from markdown summary', () => {
    assert.deepEqual(parseComplaintFieldsFromReply(reply), {
      orderNumber: 'INV-TEST-001',
      outlet: 'Selalu Teh Danau Murung',
      orderItems: 'Teh Asli 5 pcs',
      issue: 'Pesanan yang diterima tidak sesuai.',
    });
  });

  it('builds complaint data ready for persistence', () => {
    const complaintData = buildAutoComplaintData({
      reply,
      userText: 'Saya komplain pesanan salah.',
      contact: { name: 'Mridhoda', phone: '08123456789' },
    });

    assert.match(complaintData.text, /INV-TEST-001/);
    assert.match(complaintData.text, /Selalu Teh Danau Murung/);
    assert.match(complaintData.text, /Teh Asli 5 pcs/);
    assert.equal(complaintData.subject, 'Pesanan tidak sesuai - INV-TEST-001');
    assert.equal(complaintData.description, complaintData.text);
    assert.equal(complaintData.priority, 'high');
    assert.equal(complaintData.contactName, 'Mridhoda');
    assert.equal(complaintData.contactPhone, '08123456789');
    assert.equal(complaintData.formData.source, 'ai_auto_complaint_detection');
  });

  it('extracts order complaint details from customer text', () => {
    assert.deepEqual(parseComplaintFieldsFromText('Nomor pesanannya INV-TEST-004. Iya, saya ambil di outlet Selalu Teh Danau Murung. Saya sudah checkout dan sudah bayar sebelumnya. Masalahnya saya pesan Teh Asli 5 pcs, tapi yang saya terima bukan Teh Asli.'), {
      orderNumber: 'INV-TEST-004',
      outlet: 'Selalu Teh Danau Murung',
      orderItems: 'Teh Asli 5 pcs',
      issue: 'saya pesan Teh Asli 5 pcs, tapi yang saya terima bukan Teh Asli',
    });
  });

  it('auto-creates when customer provided enough complaint details even if reply only points to support', () => {
    assert.equal(shouldAutoCreateComplaintFromReply({
      reply: 'Sebaiknya kamu menghubungi support dengan bukti pembayaran agar bisa segera dibantu proses komplain dan penggantiannya.',
      userText: 'Nomor pesanannya INV-TEST-004. Iya, saya ambil di outlet Selalu Teh Danau Murung. Saya sudah checkout dan sudah bayar sebelumnya. Masalahnya saya pesan Teh Asli 5 pcs, tapi yang saya terima bukan Teh Asli.',
    }), true);
  });
});
