const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// Serve os arquivos do site (index.html, style.css, imagens, etc.)
app.use(express.static('./'));

// Sua chave da API da Supercell
const API_KEY = process.env.SUPERCELL_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImUxMzRmNGE5LWVhZWUtNDg1MS05MzgxLTk4ZWQzNjQwNTgxMiIsImlhdCI6MTc4NzY1MzU3NSwic3ViIjoiZGV2ZWxvcGVyL2RhZDhiYWZiLWViMjItNDQwMC04YTU0LTdjOTU5N2M5YTAyZSIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiNzQuMjIwLjQ4LjMwIl0sInR5cGUiOiJjbGllbnQifV19.1K5Vv7aHghJ0XrnlnXmMR1xRhoTASpI5dxhJX65wlJ_I3ReFX_yWqKkX-fcYw7BqMKA-CuvymNQPUfqSNeSitA
';

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

// Busca os membros de todos os clubes cadastrados
async function atualizarCache() {
  console.log('🔄 Iniciando busca dos membros dos clubes BBR...');
  const todosJogadores = new Map();

  for (const tag of CLUB_TAGS) {
    try {
      const cleanTag = tag.replace('#', '');
      const resposta = await axios.get(`https://api.brawlstars.com/v1/clubs/%23${cleanTag}/members`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });

      const membros = resposta.data.items || [];

      for (const membro of membros) {
        if (!todosJogadores.has(membro.tag)) {
          todosJogadores.set(membro.tag, {
            nome: membro.name,
            tag: membro.tag,
            trofeus: membro.trophies,
            pontos: membro.icon ? membro.icon.id : 0,
            clube: resposta.data.name || 'BBR'
          });
        }
      }
    } catch (erro) {
      console.error(`⚠️ Erro ao buscar membros do clube ${tag}:`, erro.response ? erro.response.status : erro.message);
    }
  }

  const listaOrdenada = Array.from(todosJogadores.values());
  listaOrdenada.sort((a, b) => b.trofeus - a.trofeus);

  cacheRanking = listaOrdenada;
  console.log(`✅ Cache atualizado! Total de jogadores processados: ${cacheRanking.length}`);
}

// Atualiza o cache ao iniciar o servidor
atualizarCache();

// Atualiza a cada 15 minutos
setInterval(atualizarCache, 15 * 60 * 1000);

// Endpoint consumido pelo front-end
app.get('/api/ranking', (req, res) => {
  res.json(cacheRanking);
});
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
