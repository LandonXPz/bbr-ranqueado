const express = require('express');
const app = express();

// Serve os arquivos estáticos (index.html, script.js, etc.)
app.use(express.static('./'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor estático BBR Ranqueado rodando na porta ${PORT}`);
});
