const { randomUUID } = require('node:crypto');
const repository = require('../repositories/documents.repository');

function generateDocumentId() {
  return randomUUID();
}

function createDocument(file, owner) {
  return repository.create({
    id: file.filename,
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  }, file.path);
}

function listDocuments() {
  return repository.findAll();
}

function getDocumentForDownload(id) {
  const record = repository.findById(id);
  if (!record) {
    throw Object.assign(new Error('Documento não encontrado.'), { status: 404 });
  }
  return record;
}

function prepareStorage() {
  return repository.prepareStorage();
}

function discardUpload(file) {
  return repository.removeFile(file.path);
}

module.exports = {
  generateDocumentId,
  createDocument,
  listDocuments,
  getDocumentForDownload,
  prepareStorage,
  discardUpload,
};