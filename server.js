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
let processando = false;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function atualizarCacheComFila() {
  if (processando) return;
  processando = true;

  console.log("🔄 [FILA] Iniciando varredura lenta dos clubes e jogadores...");
  let listaTemp = [];

  for (const clube of CLUBES) {
    try {
      const cleanTag = clube.tag.replace('#', '').trim();
      
      // 1. Busca os membros do clube via BrawlAPI
      const resClube = await axios.get(`https://api.brawlapi.com/v1/clubs/%23${cleanTag}`, { timeout: 10000 });
      const membros = resClube.data.members || resClube.data.items || [];

      console.log(`📌 Clube ${clube.nome}: ${membros.length} membros encontrados. Mapeando Elo individual...`);

      for (const m of membros) {
        const tagMembro = m.tag.replace('#', '').trim();
        let eloRanked = 0;

        try {
          // 2. Busca o Elo individual no Brawl Time Ninja
          const resPlayer = await axios.get(`https://brawltime.ninja/api/trpc/player.byTag?input=%7B%22json%22%3A%22${tagMembro}%22%7D`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000
          });

          const pData = resPlayer.data?.result?.data?.json;
          // Extrai o Elo atual da Ranqueada
          eloRanked = pData?.ranked?.current || pData?.powerLeague?.current || 0;
        } catch (e) {
          // Fallback silencioso caso ocorra instabilidade em um jogador específico
          eloRanked = 0;
        }

        listaTemp.push({
          tag: m.tag,
          name: m.name,
          trophies: m.trophies || 0,
          pontos: eloRanked > 0 ? eloRanked : (m.trophies || 0), // Exibe Elo; se zerado, usa troféus
          eloRanked: eloRanked,
          clubName: clube.nome
        });

        // Atualiza o cache vivo a cada jogador adicionado para o site não ficar sem dados
        rankingCache = [...listaTemp].sort((a, b) => b.pontos - a.pontos);

        // 🛑 Pausa de 2 segundos entre requisições para evitar erro 429
        await delay(2000);
      }
    } catch (err) {
      console.log(`❌ Erro ao processar clube ${clube.nome}:`, err.message);
    }
  }

  console.log(`🚀 [FILA CONCLUÍDA] Total de ${rankingCache.length} jogadores atualizados com sucesso!`);
  processando = false;
}

// Endpoint lido pelo frontend
app.get('/api/ranking', (req, res) => {
  res.json(rankingCache);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor BBR com Fila rodando na porta ${PORT}`);
  
  // Inicia o mapeamento imediatamente
  atualizarCacheComFila();
  
  // Reinicia a varredura a cada 30 minutos
  setInterval(atualizarCacheComFila, 30 * 60 * 1000);
});
