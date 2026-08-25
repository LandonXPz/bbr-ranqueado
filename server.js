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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function atualizarCacheRanking() {
  console.log("🔄 Buscando membros e Elo via Brawl Time Ninja API...");
  let listaAtualizada = [];

  for (const clube of CLUBES) {
    try {
      // 1. Busca os membros do clube via API pública
      const tagClube = clube.tag.replace('#', '');
      const resClube = await axios.get(`https://brawltime.ninja/api/trpc/club.byTag?input=%7B%22json%22%3A%22${tagClube}%22%7D`);
      
      const dadosClube = resClube.data?.result?.data?.json;
      const membros = dadosClube?.members || [];

      for (const membro of membros) {
        const tagMembro = membro.tag.replace('#', '');
        let eloAtual = 0;

        try {
          // 2. Busca o perfil individual para extrair o Elo da Ranqueada
          const resPlayer = await axios.get(`https://brawltime.ninja/api/trpc/player.byTag?input=%7B%22json%22%3A%22${tagMembro}%22%7D`);
          const playerJson = resPlayer.data?.result?.data?.json;
          
          // Extrai o Elo atual da Ranqueada
          eloAtual = playerJson?.ranked?.current || playerJson?.powerLeague?.current || 0;
        } catch (e) {
          console.log(`⚠️ Não foi possível obter Elo de ${membro.name}`);
        }

        listaAtualizada.push({
          tag: membro.tag,
          name: membro.name,
          trophies: membro.trophies || 0,
          pontos: eloAtual,
          clubName: clube.nome
        });

        // Pausa curta de segurança para evitar excesso de requisições
        await delay(150);
      }
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
