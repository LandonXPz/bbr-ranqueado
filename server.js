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

async function atualizarCacheRanking() {
  console.log("🔄 Buscando membros dos clubes via BrawlAPI...");
  let listaAtualizada = [];

  for (const clube of CLUBES) {
    try {
      // Formatação limpa da Tag do Clube
      const cleanTag = clube.tag.replace('#', '');
      const url = `https://api.brawlapi.com/v1/clubs/%23${cleanTag}`;
      
      const res = await axios.get(url, { timeout: 10000 });
      const membros = res.data.members || [];

      membros.forEach(membro => {
        listaAtualizada.push({
          tag: membro.tag,
          name: membro.name,
          trophies: membro.trophies || 0,
          // Como fallback seguro, exibe os troféus/pontuação base do membro
          pontos: membro.trophies || 0, 
          clubName: clube.nome
        });
      });
    } catch (err) {
      console.log(`⚠️ Erro ao carregar clube ${clube.nome}:`, err.message);
    }
  }

  if (listaAtualizada.length > 0) {
    rankingCache = listaAtualizada;
    console.log(`✅ SUCESSO! Total de ${rankingCache.length} jogadores carregados no cache.`);
  } else {
    console.log("❌ NENHUM dado foi carregado nesta tentativa.");
  }
}

// Rota utilizada pelo seu script.js frontend
app.get('/api/ranking', (req, res) => {
  res.json(rankingCache);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  atualizarCacheRanking();
  // Atualiza os dados a cada 10 minutos
  setInterval(atualizarCacheRanking, 10 * 60 * 1000);
});
