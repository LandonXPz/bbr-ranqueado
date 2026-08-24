const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImQzMTQzNjdiLWJlZmItNDAxNi04OTM1LWQ5YzQ4OTBiOTgyOCIsImlhdCI6MTc4NzU5NzExOCwic3ViIjoiZGV2ZWxvcGVyL2RhZDhiYWZiLWViMjItNDQwMC04YTU0LTdjOTU5N2M5YTAyZSIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiMTkxLjU0LjIwMy44NyJdLCJ0eXBlIjoiY2xpZW50In1dfQ.LzPlYq_m92OH4aQwVK4f3f_gkKwjjhqQlidYvrZuORdKCiAiyAzLePiNFX5tkqSSfVFWv2CcXHeW0aijfGbTSQ';

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

// Armazenamento em memória (Cache)
let rankingCache = [];
let carregandoDados = false;

// Função auxiliar para aguardar entre requisições
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função que atualiza o cache dos jogadores
async function atualizarCacheRanking() {
  if (carregandoDados) return;
  carregandoDados = true;

  console.log("🔄 Iniciando atualização do cache do ranking...");
  let listaAtualizada = [];

  for (const clube of CLUBES) {
    try {
      // 1. Busca os membros do clube
      const resClube = await axios.get(
        `https://api.brawlstars.com/v1/clubs/%23${clube.tag}/members`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      );

      const membros = resClube.data.items || [];

      // 2. Busca detalhes de cada jogador com intervalo
      for (const membro of membros) {
        let pontosRanqueada = 0;
        const tagLimpa = membro.tag.replace('#', '');

        try {
          const resPlayer = await axios.get(
            `https://api.brawlstars.com/v1/players/%23${tagLimpa}`,
            { headers: { Authorization: `Bearer ${API_KEY}` } }
          );

          const data = resPlayer.data;
          
          // Extrai o ELO atual ou melhor ELO da Ranqueada
          pontosRanqueada = data.rankedElo || data.rankedRank || data.highestPowerLeagueRank || 0;
        } catch (e) {
          // Em caso de falha individual, usa 0
          pontosRanqueada = 0;
        }

        listaAtualizada.push({
          tag: membro.tag,
          name: membro.name,
          trophies: membro.trophies || 0,
          pontos: pontosRanqueada,
          clubName: clube.nome
        });

        // Pausa de 80ms entre chamadas de perfil para não exceder limites da API
        await sleep(80);
      }
    } catch (err) {
      console.log(`⚠️ Erro ao buscar clube ${clube.nome}:`, err.message);
    }
  }

  if (listaAtualizada.length > 0) {
    rankingCache = listaAtualizada;
    console.log(`✅ Cache atualizado com sucesso! Total de ${rankingCache.length} jogadores.`);
  }

  carregandoDados = false;
}

// Endpoint que entrega o ranking salvo no cache
app.get('/api/ranking', (req, res) => {
  // Se ainda não concluiu a primeira carga, retorna o que tem ou avisa
  res.json(rankingCache);
});

app.listen(3000, () => {
  console.log("🚀 Servidor BBR Ranqueado rodando na porta 3000");
  
  // Executa a primeira atualização de cache ao iniciar
  atualizarCacheRanking();

  // Atualiza o cache automaticamente a cada 15 minutos (900.000 ms)
  setInterval(atualizarCacheRanking, 15 * 60 * 1000);
});