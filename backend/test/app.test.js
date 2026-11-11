const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const { mkdtemp, readdir, readFile, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const MAX_UPLOAD_BYTES = 32;
const DOCUMENT_KEYS = ['id', 'originalName', 'owner', 'size', 'uploadedAt'];

describe('API de documentos', () => {
  let server;
  let baseUrl;
  let storageDirectory;
  const previousEnv = {};

  before(async () => {
    storageDirectory = await mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
    const testEnv = { DMS_STORAGE_DIR: storageDirectory, MAX_UPLOAD_BYTES: String(MAX_UPLOAD_BYTES) };
    for (const [key, value] of Object.entries(testEnv)) {
      previousEnv[key] = process.env[key];
      process.env[key] = value;
    }

    // O app lê DMS_STORAGE_DIR e MAX_UPLOAD_BYTES ao ser carregado, por isso o require fica aqui.
    const app = require('../src/app');
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await rm(storageDirectory, { recursive: true, force: true });
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  function buildUploadForm(options = {}) {
    const { content, filename, owner } = {
      content: 'document body',
      filename: 'relatorio.txt',
      owner: 'Marina',
      ...options,
    };
    const form = new FormData();
    form.append('file', new Blob([content]), filename);
    if (owner !== undefined) form.append('owner', owner);
    return form;
  }

  async function uploadDocument(options) {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: buildUploadForm(options),
    });
    assert.equal(response.status, 201);
    return response.json();
  }

  describe('POST /upload', () => {
    test('grava o arquivo no storage e retorna os metadados com status 201', async () => {
      const document = await uploadDocument();

      assert.match(document.id, /^[0-9a-f-]{36}$/i);
      assert.equal(document.originalName, 'relatorio.txt');
      assert.equal(document.owner, 'Marina');
      assert.equal(document.size, 'document body'.length);
      assert.ok(!Number.isNaN(Date.parse(document.uploadedAt)));
      assert.deepEqual(Object.keys(document).sort(), DOCUMENT_KEYS);
      assert.equal(await readFile(path.join(storageDirectory, document.id), 'utf8'), 'document body');
    });

    test('remove espaços extras do proprietário', async () => {
      const document = await uploadDocument({ owner: '  Marina  ' });

      assert.equal(document.owner, 'Marina');
    });

    test('não usa o nome original do arquivo como caminho no storage', async () => {
      const filesBefore = await readdir(storageDirectory);
      const document = await uploadDocument({ filename: '../fora-do-storage.txt' });

      const newFiles = (await readdir(storageDirectory)).filter((name) => !filesBefore.includes(name));
      assert.deepEqual(newFiles, [document.id]);
    });

    test('rejeita upload sem owner com 400 e descarta o arquivo temporário', async () => {
      const filesBefore = await readdir(storageDirectory);
      const response = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        body: buildUploadForm({ owner: undefined }),
      });

      assert.equal(response.status, 400);
      assert.ok((await response.json()).error);
      assert.deepEqual(await readdir(storageDirectory), filesBefore);
    });

    test('rejeita requisição sem o campo file com 400', async () => {
      const form = new FormData();
      form.append('owner', 'Marina');
      const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });

      assert.equal(response.status, 400);
      assert.ok((await response.json()).error);
    });

    test('rejeita arquivo acima de MAX_UPLOAD_BYTES com 413 e descarta o arquivo', async () => {
      const filesBefore = await readdir(storageDirectory);
      const response = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        body: buildUploadForm({ content: 'x'.repeat(MAX_UPLOAD_BYTES + 1), filename: 'grande.txt' }),
      });

      assert.equal(response.status, 413);
      assert.ok((await response.json()).error);
      assert.deepEqual(await readdir(storageDirectory), filesBefore);
    });
  });

  describe('GET /documents', () => {
    test('retorna 200 com um array JSON que contém o documento enviado', async () => {
      const document = await uploadDocument({ filename: 'listagem.txt' });
      const response = await fetch(`${baseUrl}/documents`);

      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /application\/json/);
      const documents = await response.json();
      assert.ok(Array.isArray(documents));
      assert.deepEqual(documents.find((item) => item.id === document.id), document);
    });

    test('expõe apenas os metadados de cada documento', async () => {
      await uploadDocument({ filename: 'metadados.txt' });
      const documents = await (await fetch(`${baseUrl}/documents`)).json();

      assert.ok(documents.length > 0);
      for (const item of documents) {
        assert.deepEqual(Object.keys(item).sort(), DOCUMENT_KEYS);
      }
    });
  });

  describe('GET /documents/:id/download', () => {
    test('retorna o conteúdo original como anexo', async () => {
      const document = await uploadDocument({ content: 'document body', filename: 'contrato.txt' });
      const response = await fetch(`${baseUrl}/documents/${document.id}/download`);

      assert.equal(response.status, 200);
      assert.equal(await response.text(), 'document body');
      assert.match(response.headers.get('content-disposition'), /^attachment;.*contrato\.txt/);
    });

    test('retorna 404 para um id desconhecido', async () => {
      const response = await fetch(`${baseUrl}/documents/${randomUUID()}/download`);

      assert.equal(response.status, 404);
      assert.ok((await response.json()).error);
    });

    test('retorna 404 para um id com caminho relativo', async () => {
      const response = await fetch(
        `${baseUrl}/documents/${encodeURIComponent('../../etc/passwd')}/download`,
      );

      assert.equal(response.status, 404);
    });

    test('retorna 404 quando o arquivo não existe mais no storage', async () => {
      const document = await uploadDocument({ filename: 'removido.txt' });
      await rm(path.join(storageDirectory, document.id));
      const response = await fetch(`${baseUrl}/documents/${document.id}/download`);

      assert.equal(response.status, 404);
      assert.ok((await response.json()).error);
    });
  });
});
