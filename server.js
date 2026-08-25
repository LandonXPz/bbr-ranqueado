const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('./'));

const CLUBES = [
  { tag: 'CQYU8RQP', nome: 'BBR | Elite' },
  { tag: '2Q8LGGUQY', nome: 'BBR | Mestres' },
  { tag: '820QG8Q2V', nome: 'BBR | Lendário' },
  { tag: '2LVV8J8C8', nome: 'BBR | Mítico' },
  { tag: '80GYP9LCG', nome: 'BBR | Diamante' },
  { tag: '80LJYQ982', nome: 'BBR | Ouro' },
  { tag: '80VCJU8LV', nome: 'BBR | Prata' },
  { tag: '2CRUQ29LL', nome: 'BBR | Bronze' }
];

let rankingCache = [];

// Função auxiliar para buscar com fallback de Proxy contra bloqueio de IP
async function fetchComProxy(targetUrl) {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
  const response = await axios.get(proxyUrl, { timeout: 12000 });
  
  if (response.data && response.data.contents) {
    return JSON.parse(response.data.contents);
  }
  throw new Error("Resposta de Proxy inválida");
}

async function atualizarCacheRanking() {
  console.log("🔄 [SISTEMA] Iniciando busca nos 8 Clubes...");
  let todosMembros = [];

  for (const clube of CLUBES) {
    try {
      const cleanTag = clube.tag.replace('#', '').trim();
      
      // 1. Busca os membros do clube via BrawlAPI
      const urlClube = `https://api.brawlapi.com/v1/clubs/%23${cleanTag}`;
      let dataClube;

      try {
        const res = await axios.get(urlClube, { timeout: 8000 });
        dataClube = res.data;
      } catch (e) {
        // Se a chamada direta falhar/bloquear, usa o Proxy automaticamente
        dataClube = await fetchComProxy(urlClube);
      }

      const membros = dataClube.members || dataClube.items || [];
      console.log(`📌 ${clube.nome}: ${membros.length} membros encontrados.`);

      // 2. Mapeia todos os jogadores daquele clube
      for (const m of membros) {
        todosMembros.push({
          tag: m.tag,
          name: m.name,
          trophies: m.trophies || 0,
          // Mapeia os pontos de Troféus/Elo para exibição imediata
          pontos: m.trophies || 0, 
          clubName: clube.nome
        });
      }

    } catch (err) {
      console.log(`❌ Falha no clube ${clube.nome}: ${err.message}`);
    }
  }

  if (todosMembros.length > 0) {
    // Ordena do maior para o menor ponto
    todosMembros.sort((a, b) => b.pontos - a.pontos);
    rankingCache = todosMembros;
    console.log(`✅ [SUCESSO TOTAL] ${rankingCache.length} jogadores prontos no cache!`);
  } else {
    console.log("⚠️ NENHUM dado foi atualizado nesta rodada.");
  }
}

// Rota utilizada pelo seu script.js do site
app.get('/api/ranking', (req, res) => {
  res.json(rankingCache);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor BBR rodando na porta ${PORT}`);
  atualizarCacheRanking();
  
  // Atualiza o cache a cada 5 minutos em segundo plano
  setInterval(atualizarCacheRanking, 5 * 60 * 1000);
});
