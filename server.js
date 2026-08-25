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
  console.log("🔄 Buscando membros via Brawlify...");
  let listaAtualizada = [];

  for (const clube of CLUBES) {
    try {
      // Endpoint correto alternativo do Brawlify
      const resClube = await axios.get(
        `https://api.brawlify.com/v1/clubs/${clube.tag}`
      );

      const membros = resClube.data.members || [];

      membros.forEach(membro => {
        listaAtualizada.push({
          tag: membro.tag,
          name: membro.name,
          trophies: membro.trophies || 0,
          pontos: membro.trophies || 0,
          clubName: clube.nome
        });
      });
    } catch (err) {
      console.log(`⚠️ Erro no clube ${clube.nome}:`, err.message);
    }
  }

  if (listaAtualizada.length > 0) {
    rankingCache = listaAtualizada;
    console.log(`✅ Sucesso! Total de ${rankingCache.length} jogadores.`);
  }
}

app.get('/api/ranking', (req, res) => {
  res.json(rankingCache);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  atualizarCacheRanking();
  setInterval(atualizarCacheRanking, 10 * 60 * 1000);
});
