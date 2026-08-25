const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('./'));

const API_KEY = process.env.SUPERCELL_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImUxMzRmNGE5LWVhZWUtNDg1MS05MzgxLTk4ZWQzNjQwNTgxMiIsImlhdCI6MTc4NzY1MzU3NSwic3ViIjoiZGV2ZWxvcGVyL2RhZDhiYWZiLWViMjItNDQwMC04YTU0LTdjOTU5N2M5YTAyZSIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiNzQuMjIwLjQ4LjMwIl0sInR5cGUiOiJjbGllbnQifV19.1K5Vv7aHghJ0XrnlnXmMR1xRhoTASpI5dxhJX65wlJ_I3ReFX_yWqKkX-fcYw7BqMKA-CuvymNQPUfqSNeSitA';

const CLUBE_INFO = {
  '#CQYU8RQP':  { nome: 'BBR | Elite' },
  '#2Q8LGGUQY': { nome: 'BBR | Mestres' },
  '#820QG8Q2V': { nome: 'BBR | Lendário' },
  '#2LVV8J8C8': { nome: 'BBR | Mítico' },
  '#80GYP9LCG': { nome: 'BBR | Diamante' },
  '#80LJYQ982': { nome: 'BBR | Ouro' },
  '#80VCJU8LV': { nome: 'BBR | Prata' },
  '#2CRUQ29LL': { nome: 'BBR | Bronze' }
};

let cacheRanking = [];

async function atualizarCache() {
  try {
    console.log('🔄 Buscando Elo da Ranqueada de cada jogador...');
    const todosJogadores = new Map();

    for (const [tagClube, info] of Object.entries(CLUBE_INFO)) {
      const tagClubeFormatada = encodeURIComponent(tagClube);
      const urlClube = `https://api.brawlstars.com/v1/clubs/${tagClubeFormatada}/members`;

      const respClube = await axios.get(urlClube, {
        headers: { Authorization: `Bearer ${API_KEY}` }
      });

      for (const membro of respClube.data.items) {
        if (!todosJogadores.has(membro.tag)) {
          let eloRanqueada = 0;

          try {
            const tagPlayerFormatada = encodeURIComponent(membro.tag);
            const urlPlayer = `https://api.brawlstars.com/v1/players/${tagPlayerFormatada}`;
            const respPlayer = await axios.get(urlPlayer, {
              headers: { Authorization: `Bearer ${API_KEY}` }
            });

            // Puxa o Elo real da Ranqueada
            eloRanqueada = respPlayer.data.rankedPoints 
              || respPlayer.data.ranked?.current?.points 
              || respPlayer.data.highestRankedPoints 
              || 0;
          } catch (e) {
            // Em caso de limite de requisicoes, mantem 0
          }

          todosJogadores.set(membro.tag, {
            tag: membro.tag,
            nome: membro.name,
            trofeus: membro.trophies,
            pontos: eloRanqueada,
            clube: info.nome
          });
        }
      }
    }

    const listaOrdenada = Array.from(todosJogadores.values());
    listaOrdenada.sort((a, b) => b.pontos - a.pontos);

    cacheRanking = listaOrdenada;
    console.log(`✅ Ranking atualizado! Total: ${cacheRanking.length} jogadores.`);
  } catch (error) {
    console.error('❌ Erro ao atualizar cache:', error.response?.data || error.message);
  }
}

atualizarCache();
setInterval(atualizarCache, 20 * 60 * 1000);

app.get('/api/ranking', (req, res) => {
  res.json(cacheRanking);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
