const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

app.use(express.static('./'));

const API_KEY = process.env.SUPERCELL_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImUxMzRmNGE5LWVhZWUtNDg1MS05MzgxLTk4ZWQzNjQwNTgxMiIsImlhdCI6MTc4NzY1MzU3NSwic3ViIjoiZGV2ZWxvcGVyL2RhZDhiYWZiLWViMjItNDQwMC04YTU0LTdjOTU5N2M5YTAyZSIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiNzQuMjIwLjQ4LjMwIl0sInR5cGUiOiJjbGllbnQifV19.1K5Vv7aHghJ0XrnlnXmMR1xRhoTASpI5dxhJX65wlJ_I3ReFX_yWqKkX-fcYw7BqMKA-CuvymNQPUfqSNeSitA';

const CLUBES = {
  '#CQYU8RQP':  'BBR | Elite',
  '#2Q8LGGUQY': 'BBR | Mestres',
  '#820QG8Q2V': 'BBR | Lendário',
  '#2LVV8J8C8': 'BBR | Mítico',
  '#80GYP9LCG': 'BBR | Diamante',
  '#80LJYQ982': 'BBR | Ouro',
  '#80VCJU8LV': 'BBR | Prata',
  '#2CRUQ29LL': 'BBR | Bronze'
};

let cacheRanking = [];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Função para extrair o Elo/Pontos do Ranqueado em qualquer formato retornado pela API
function extrairPontosRanqueado(dados) {
  if (!dados) return 0;
  
  // 1. Tenta propriedades diretas conhecidas
  if (dados.rankedPoints) return dados.rankedPoints;
  if (dados.soloRankedPoints) return dados.soloRankedPoints;
  if (dados.ranked && typeof dados.ranked === 'number') return dados.ranked;
  if (dados.ranked && dados.ranked.current) return dados.ranked.current;
  
  // 2. Procura em arrays de estatísticas/atribuições caso a API envie mapeado
  if (Array.isArray(dados.stats)) {
    const statRanked = dados.stats.find(s => s.name && s.name.toLowerCase().includes('ranked'));
    if (statRanked && statRanked.value) return statRanked.value;
  }

  return 0;
}

async function atualizarCache() {
  try {
    const todosJogadores = new Map();

    for (const [tagClube, nomeClube] of Object.entries(CLUBES)) {
      const tagClubeFormatada = encodeURIComponent(tagClube);
      const urlClube = `https://api.brawlstars.com/v1/clubs/${tagClubeFormatada}/members`;

      const resClube = await axios.get(urlClube, {
        headers: { Authorization: `Bearer ${API_KEY}` }
      });

      for (const membro of resClube.data.items) {
        if (!todosJogadores.has(membro.tag)) {
          let pontosRanqueado = 0;

          try {
            const tagJogadorFormatada = encodeURIComponent(membro.tag);
            const resJogador = await axios.get(
              `https://api.brawlstars.com/v1/players/${tagJogadorFormatada}`,
              { headers: { Authorization: `Bearer ${API_KEY}` } }
            );

            pontosRanqueado = extrairPontosRanqueado(resJogador.data);
          } catch (errPlayer) {
            pontosRanqueado = 0;
          }

          todosJogadores.set(membro.tag, {
            tag: membro.tag,
            nome: membro.name,
            trofeus: membro.trophies,
            pontos: pontosRanqueado,
            clube: nomeClube
          });

          // Aguarda 60ms entre requisições de jogadores para evitar bloqueio da API
          await delay(60);
        }
      }
    }

    const listaOrdenada = Array.from(todosJogadores.values());
    listaOrdenada.sort((a, b) => b.trofeus - a.trofeus);

    cacheRanking = listaOrdenada;
    console.log(`✅ Cache atualizado com sucesso! Total de jogadores: ${cacheRanking.length}`);
  } catch (error) {
    console.error('❌ Erro ao atualizar cache:', error.response?.data || error.message);
  }
}

atualizarCache();
setInterval(atualizarCache, 15 * 60 * 1000);

app.get('/api/ranking', (req, res) => {
  res.json(cacheRanking);
});

app.get('/meu-ip', (req, res) => {
  const https = require('https');
  https.get('https://api.ipify.org?format=json', (resposta) => {
    let dados = '';
    resposta.on('data', (chunk) => { dados += chunk; });
    resposta.on('end', () => { res.send(dados); });
  }).on('error', (err) => { res.status(500).send(err.message); });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
