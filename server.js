const express = require('express');
const axios = require('axios'); // Axios importado corretamente aqui
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('./'));

// Sua chave oficial cadastrada no portal de desenvolvedores
const BRAWL_STARS_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImQyYWI0Y2Y4LTYyNTMtNDE2YS1hZGJiLWRmYjcyYzcyMzBkOCIsImlhdCI6MTc4NzY2MDA1OSwic3ViIjoiZGV2ZWxvcGVyL2RhZDhiYWZiLWViMjItNDQwMC04YTU0LTdjOTU5N2M5YTAyZSIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiMTc3LjE5MS42MC4yMDEiXSwidHlwZSI6ImNsaWVudCJ9XX0.Yg8r0FqJrRqsa-5z9vUudXxmw6Bvbar8Mhdthd3Yu7yzcISNEW4NxgN_VbIOHQlyqJKugHswEH2zhHU4tErZWg"; 

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

// Converte o número retornado pelo jogo no nome do Elo correspondente
function obterNomeElo(highestPowerLeagueRank) {
  const elos = {
    1: "Bronze I", 2: "Bronze II", 3: "Bronze III",
    4: "Prata I", 5: "Prata II", 6: "Prata III",
    7: "Ouro I", 8: "Ouro II", 9: "Ouro III",
    10: "Diamante I", 11: "Diamante II", 12: "Diamante III",
    13: "Mítico I", 14: "Mítico II", 15: "Mítico III",
    16: "Lendário I", 17: "Lendário II", 18: "Lendário III",
    19: "Mestre"
  };
  return elos[highestPowerLeagueRank] || "Sem Rank";
}

async function atualizarCacheRanking() {
  console.log("🔄 Buscando membros dos clubes na API Oficial do Brawl Stars...");
  
  // Linha extra que verifica o IP público atual do seu servidor nos logs (ajuda muito na Render)
  try {
    const ipCheck = await axios.get('https://ipify.org');
    console.log(`🌍 IP atual do meu servidor: ${ipCheck.data.ip}`);
  } catch (e) {
    console.log("⚠️ Não foi possível identificar o IP público atual.");
  }

  let listaAtualizada = [];
  const headers = { 'Authorization': `Bearer ${BRAWL_STARS_TOKEN}` };

  for (const clube of CLUBES) {
    try {
      const cleanTag = clube.tag.replace('#', '').trim();
      const response = await axios.get(`https://brawlstars.com{cleanTag}`, { headers, timeout: 10000 });
      const membros = response.data.members || [];

      console.log(`⏳ Coletando Elo individual de ${membros.length} membros de ${clube.nome}...`);

      for (const membro of membros) {
        try {
          const pTag = membro.tag.replace('#', '').trim();
          const pResponse = await axios.get(`https://brawlstars.com{pTag}`, { headers, timeout: 5000 });
          const pData = pResponse.data;
          const eloId = pData.highestPowerLeagueRank || 0; 

          listaAtualizada.push({
            tag: membro.tag,
            name: membro.name,
            trophies: membro.trophies || 0,
            elo: obterNomeElo(eloId),
            eloId: eloId,
            clubName: clube.nome
          });
        } catch (playerErr) {
          listaAtualizada.push({
            tag: membro.tag,
            name: membro.name,
            trophies: membro.trophies || 0,
            elo: "Não carregado",
            eloId: 0,
            clubName: clube.nome
          });
        }
      }
      console.log(`✅ ${clube.nome}: Finalizado.`);
    } catch (err) {
      console.log(`❌ Erro de conexão no clube ${clube.nome}:`, err.message);
    }
  }

  if (listaAtualizada.length > 0) {
    rankingCache = listaAtualizada.sort((a, b) => b.trophies - a.trophies);
    console.log(`🚀 SUCESSO: ${rankingCache.length} jogadores atualizados no cache.`);
  } else {
    console.log("❌ NENHUM jogador pôde ser sincronizado.");
  }
}

app.get('/api/ranking', (req, res) => {
  res.json(rankingCache);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  atualizarCacheRanking();
  setInterval(atualizarCacheRanking, 20 * 60 * 1000); 
});
