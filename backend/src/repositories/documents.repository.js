const path = require('node:path');
const { mkdir, unlink } = require('node:fs/promises');

const storageDirectory = path.resolve(
  process.env.DMS_STORAGE_DIR || path.resolve(__dirname, '../../storage'),
);
const documents = new Map();

async function prepareStorage() {
  await mkdir(storageDirectory, { recursive: true });
  return storageDirectory;
}

function create(document, filePath) {
  documents.set(document.id, { document: { ...document }, filePath });
  return { ...document };
}

function findAll() {
  return Array.from(documents.values(), ({ document }) => ({ ...document }));
}

function findById(id) {
  const record = documents.get(id);
  return record ? { document: { ...record.document }, filePath: record.filePath } : null;
}

async function removeFile(filePath) {
  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

module.exports = { prepareStorage, create, findAll, findById, removeFile };