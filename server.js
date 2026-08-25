const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('./'));

const API_KEY = process.env.SUPERCELL_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImQyYWI0Y2Y4LTYyNTMtNDE2YS1hZGJiLWRmYjcyYzcyMzBkOCIsImlhdCI6MTc4NzY2MDA1OSwic3ViIjoiZGV2ZWxvcGVyL2RhZDhiYWZiLWViMjItNDQwMC04YTU0LTdjOTU5N2M5YTAyZSIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiMTc3LjE5MS42MC4yMDEiXSwidHlwZSI6ImNsaWVudCJ9XX0.Yg8r0FqJrRqsa-5z9vUudXxmw6Bvbar8Mhdthd3Yu7yzcISNEW4NxgN_VbIOHQlyqJKugHswEH2zhHU4tErZWg';

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

async function checarIPDoRender() {
  try {
    const res = await axios.get('https://api.ipify.org?format=json');
    console.log(`🌐 O IP ATUAL DO RENDER É: ${res.data.ip}`);
  } catch (err) {
    console.log("Não foi possível identificar o IP automaticamente.");
  }
}

async function atualizarCacheRanking() {
  console.log("🔄 Buscando membros...");
  let listaAtualizada = [];

  for (const clube of CLUBES) {
    try {
      const resClube = await axios.get(
        `https://api.brawlstars.com/v1/clubs/%23${clube.tag}/members`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      );

      const membros = resClube.data.items || [];

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
      console.log(`⚠️ Erro no clube ${clube.nome}: status ${err.response ? err.response.status : err.message}`);
    }
  }

  if (listaAtualizada.length > 0) {
    rankingCache = listaAtualizada;
    console.log(`✅ SUCESSO! Total de ${rankingCache.length} jogadores carregados.`);
  }
}

app.get('/api/ranking', (req, res) => {
  res.json(rankingCache);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
  console.log(`🚀 Servidor BBR Ranqueado rodando na porta ${PORT}`);
  await checarIPDoRender();
  atualizarCacheRanking();
  setInterval(atualizarCacheRanking, 10 * 60 * 1000);
});
