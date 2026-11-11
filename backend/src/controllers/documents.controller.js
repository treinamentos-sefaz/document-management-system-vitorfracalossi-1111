const multer = require('multer');
const service = require('../services/documents.service');

const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024);
if (!Number.isSafeInteger(maxUploadBytes) || maxUploadBytes <= 0) {
  throw new Error('MAX_UPLOAD_BYTES deve ser um inteiro positivo.');
}

const receiveUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      service.prepareStorage().then(
        (directory) => callback(null, directory),
        (error) => callback(error),
      );
    },
    filename(req, file, callback) {
      callback(null, service.generateDocumentId());
    },
  }),
  limits: { fileSize: maxUploadBytes, files: 1, fields: 1, fieldSize: 1024 },
}).single('file');

async function upload(req, res) {
  if (!req.file) {
    throw Object.assign(new Error('Envie um arquivo no campo file.'), { status: 400 });
  }
  const owner = req.body?.owner;
  if (typeof owner !== 'string' || !owner.trim()) {
    await service.discardUpload(req.file);
    throw Object.assign(new Error('Informe o proprietário no campo owner.'), { status: 400 });
  }
  res.status(201).json(service.createDocument(req.file, owner.trim()));
}

function list(req, res) {
  res.json(service.listDocuments());
}

function download(req, res, next) {
  const { document, filePath } = service.getDocumentForDownload(req.params.id);
  res.download(filePath, document.originalName, (error) => {
    if (!error) return;
    if (error.code === 'ENOENT') error.status = 404;
    next(error);
  });
}

module.exports = { receiveUpload, upload, list, download };