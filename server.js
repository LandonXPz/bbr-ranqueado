const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// Servir os arquivos do site
app.use(express.static('./'));

// Sua chave da API da Supercell (limpa e sem espaços)
const API_KEY = process.env.SUPERCELL_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImUxMzRmNGE5LWVhZWUtNDg1MS05MzgxLTk4ZWQzNjQwNTgxMiIsImlhdCI6MTc4NzY1MzU3NSwic3ViIjoiZGV2ZWxvcGVyL2RhZDhiYWZiLWViMjItNDQwMC04YTU0LTdjOTU5N2M5YTAyZSIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiNzQuMjIwLjQ4LjMwIl0sInR5cGUiOiJjbGllbnQifV19.1K5Vv7aHghJ0XrnlnXmMR1xRhoTASpI5dxhJX65wlJ_I3ReFX_yWqKkX-fcYw7BqMKA-CuvymNQPUfqSNeSitA';

// Lista com todas as TAGs dos clubes BBR
const CLUB_TAGS = [
  '#CQYU8RQP',  // BBR | Elite
  '#2Q8LGGUQY', // BBR | Mestres
  '#820QG8Q2V', // BBR | Lendário
  '#2LVV8J8C8', // BBR | Mítico
  '#80GYP9LCG', // BBR | Diamante
  '#80LJYQ982', // BBR | Ouro
  '#80VCJU8LV', // BBR | Prata
  '#2CRUQ29LL'  // BBR | Bronze
];

let cacheRanking = [];

async function atualizarCache() {
  try {
    const todosJogadores = new Map();

    for (const tag of CLUB_TAGS) {
      const tagFormatada = encodeURIComponent(tag);
      const url = `https://api.brawlstars.com/v1/clubs/${tagFormatada}/members`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${API_KEY}` }
      });

      for (const membro of response.data.items) {
        if (!todosJogadores.has(membro.tag)) {
          todosJogadores.set(membro.tag, {
            tag: membro.tag,
            nome: membro.name,
            trofeus: membro.trophies,
            clube: tag
          });
        }
      }
    }

    const listaOrdenada = Array.from(todosJogadores.values());
    listaOrdenada.sort((a, b) => b.trofeus - a.trofeus);

    cacheRanking = listaOrdenada;
    console.log(`✅ Cache atualizado! Total de jogadores processados: ${cacheRanking.length}`);
  } catch (error) {
    console.error('❌ Erro ao atualizar cache:', error.response?.data || error.message);
  }
}

// Atualiza o cache ao iniciar o servidor
atualizarCache();

// Atualiza a cada 15 minutos
setInterval(atualizarCache, 15 * 60 * 1000);

// Endpoint consumido pelo front-end
app.get('/api/ranking', (req, res) => {
  res.json(cacheRanking);
});

// Endpoint para verificar o IP do Render
app.get('/meu-ip', (req, res) => {
  const https = require('https');
  https.get('https://api.ipify.org?format=json', (resposta) => {
    let dados = '';
    resposta.on('data', (chunk) => { dados += chunk; });
    resposta.on('end', () => {
      res.send(dados);
    });
  }).on('error', (err) => {
    res.status(500).send(err.message);
  });
});

// Porta do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
