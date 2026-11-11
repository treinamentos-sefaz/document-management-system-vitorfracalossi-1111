const express = require('express');
const documentsRouter = require('./routes/documents.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentsRouter);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  let status = 500;
  let message = 'Não foi possível concluir a operação.';
  if (error.name === 'MulterError') {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = status === 413 ? 'Arquivo excede o limite de tamanho.' : 'Upload inválido.';
  } else if (error.status === 400) {
    status = 400;
    message = 'Requisição inválida: envie um arquivo em file e um proprietário em owner.';
  } else if (error.status === 404) {
    status = 404;
    message = 'Documento não encontrado ou arquivo indisponível.';
  }
  res.status(status).json({ error: message });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
