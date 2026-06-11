import assert from 'assert';
import { findAndSendFile } from '../src/services/ai.js';
import { openaiClient, geminiClient } from '../src/services/aiClient.js';

async function runTest() {
  const agent = {
    prompt: '-Kamu adalah cs yang akan mengirim file lakukan secara profesional dan langsung to the point mengirim filenya. jika ada yang minta file surat dispen selvi maka kirim kalis.1761357324620. jika ada yang minta surat dispen rafif maka kirim kalis.1761357365833',
    database: [
      {
        id: 'kalis.1761357324620',
        originalName: 'SURAT DISPENSASI SELVI.pdf',
        storedName: 'SURAT_DISPENSASI_SELVI.pdf'
      },
      {
        id: 'kalis.1761357365833',
        originalName: 'SURAT DISPENSASI RAFIF.pdf',
        storedName: 'SURAT_DISPENSASI_RAFIF.pdf'
      }
    ]
  };

  const message = 'kirim file dispen selvi';

  const result = await findAndSendFile({ agent, message, openaiClient, geminiClient });

  assert.deepStrictEqual(result, {
    text: 'Tentu, ini file SURAT DISPENSASI SELVI.pdf yang Anda minta.',
    attachment: {
      url: 'http://localhost:5000/files/SURAT_DISPENSASI_SELVI.pdf',
      filename: 'SURAT DISPENSASI SELVI.pdf',
      storedName: 'SURAT_DISPENSASI_SELVI.pdf'
    }
  });

  console.log('Test passed!');
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
