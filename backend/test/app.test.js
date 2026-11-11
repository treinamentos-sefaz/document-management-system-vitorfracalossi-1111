const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, readdir, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

test('API de documentos valida uploads e mantém os arquivos no storage', async () => {
  const previousStorageDirectory = process.env.DMS_STORAGE_DIR;
  const previousMaxUploadBytes = process.env.MAX_UPLOAD_BYTES;
  const storageDirectory = await mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  process.env.DMS_STORAGE_DIR = storageDirectory;
  process.env.MAX_UPLOAD_BYTES = '32';

  let server;
  try {
    const app = require('../src/app');
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.once('listening', resolve);
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const form = new FormData();
    form.append('file', new Blob(['document body']), '../report.txt');
    form.append('owner', 'Marina');
    const uploadResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
    assert.equal(uploadResponse.status, 201);
    const document = await uploadResponse.json();
    assert.match(document.id, /^[0-9a-f-]{36}$/i);
    assert.equal(document.owner, 'Marina');
    assert.deepEqual(Object.keys(document).sort(), ['id', 'originalName', 'owner', 'size', 'uploadedAt']);
    assert.deepEqual(await readdir(storageDirectory), [document.id]);

    const listResponse = await fetch(`${baseUrl}/documents`);
    assert.equal(listResponse.status, 200);
    assert.deepEqual(await listResponse.json(), [document]);

    const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
    assert.equal(downloadResponse.status, 200);
    assert.equal(await downloadResponse.text(), 'document body');

    const traversalResponse = await fetch(
      `${baseUrl}/documents/${encodeURIComponent('../../etc/passwd')}/download`,
    );
    assert.equal(traversalResponse.status, 404);

    const missingOwnerForm = new FormData();
    missingOwnerForm.append('file', new Blob(['orphan candidate']), 'missing-owner.txt');
    const missingOwnerResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: missingOwnerForm,
    });
    assert.equal(missingOwnerResponse.status, 400);
    assert.deepEqual(await readdir(storageDirectory), [document.id]);

    const oversizedForm = new FormData();
    oversizedForm.append('file', new Blob(['x'.repeat(33)]), 'too-large.txt');
    oversizedForm.append('owner', 'Marina');
    const oversizedResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: oversizedForm,
    });
    assert.equal(oversizedResponse.status, 413);
    assert.deepEqual(await readdir(storageDirectory), [document.id]);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await rm(storageDirectory, { recursive: true, force: true });
    if (previousStorageDirectory === undefined) delete process.env.DMS_STORAGE_DIR;
    else process.env.DMS_STORAGE_DIR = previousStorageDirectory;
    if (previousMaxUploadBytes === undefined) delete process.env.MAX_UPLOAD_BYTES;
    else process.env.MAX_UPLOAD_BYTES = previousMaxUploadBytes;
  }
});
