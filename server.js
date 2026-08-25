const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('./'));

const API_KEY = process.env.SUPERCELL_KEY;

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

// Função de pausa entre requisições para evitar estouro de tempo (Timeout 522)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function atualizarCacheRanking() {
  console.log("🔄 Buscando membros via Proxy de Requisições...");
  let listaAtualizada = [];

  for (const clube of CLUBES) {
    try {
      const targetUrl = encodeURIComponent(`https://api.brawlstars.com/v1/clubs/%23${clube.tag}/members`);
      const resClube = await axios.get(`https://api.allorigins.win/get?url=${targetUrl}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        },
        timeout: 15000
      });

      const dataParsed = JSON.parse(resClube.data.contents);
      const membros = dataParsed.items || [];

      membros.forEach(membro => {
        listaAtualizada.push({
          tag: membro.tag,
          name: membro.name,
          trophies: membro.trophies || 0,
          pontos: membro.trophies || 0,
          clubName: clube.nome
        });
      });

      // Aguarda 1 segundo antes de consultar o próximo clube
      await delay(1000);
    } catch (err) {
      console.log(`⚠️ Erro no clube ${clube.nome}:`, err.message);
    }
  }

  if (listaAtualizada.length > 0) {
    rankingCache = listaAtualizada;
    console.log(`✅ SUCESSO! Total de ${rankingCache.length} jogadores carregados no cache.`);
  }
}

app.get('/api/ranking', (req, res) => {
  res.json(rankingCache);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor BBR Ranqueado rodando na porta ${PORT}`);
  atualizarCacheRanking();
  setInterval(atualizarCacheRanking, 10 * 60 * 1000);
});
