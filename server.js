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

// Função para buscar dados contornando bloqueios de IP via Proxy
async function fetchComProxy(urlAlvo) {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlAlvo)}`;
  const res = await axios.get(proxyUrl, { timeout: 10000 });
  if (res.data && res.data.contents) {
    return JSON.parse(res.data.contents);
  }
  throw new Error("Resposta de Proxy inválida");
}

async function obterMembrosClube(cleanTag) {
  const url1 = `https://api.brawlapi.com/v1/clubs/%23${cleanTag}`;
  try {
    const res = await axios.get(url1, { timeout: 6000 });
    return res.data.members || res.data.items || [];
  } catch (e) {
    // Se o Render for bloqueado diretamente, passa pelo Proxy
    const dataProxy = await fetchComProxy(url1);
    return dataProxy.members || dataProxy.items || [];
  }
}

async function obterEloJogador(cleanTagMembro) {
  const urlPlayer = `https://brawltime.ninja/api/trpc/player.byTag?input=%7B%22json%22%3A%22${cleanTagMembro}%22%7D`;
  try {
    const res = await axios.get(urlPlayer, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const pData = res.data?.result?.data?.json;
    return pData?.ranked?.current || pData?.powerLeague?.current || 0;
  } catch (e) {
    try {
      const dataProxy = await fetchComProxy(urlPlayer);
      const pData = dataProxy?.result?.data?.json;
      return pData?.ranked?.current || pData?.powerLeague?.current || 0;
    } catch (errProxy) {
      return 0;
    }
  }
}

async function atualizarCacheComFila() {
  if (processando) return;
  processando = true;

  console.log("🔄 [SISTEMA] Buscando clubes via Proxy e mapeando Elo...");
  let listaTemp = [];

  for (const clube of CLUBES) {
    try {
      const cleanTag = clube.tag.replace('#', '').trim();
      const membros = await obterMembrosClube(cleanTag);

      console.log(`📌 Clube ${clube.nome}: ${membros.length} membros carregados.`);

      for (const m of membros) {
        const cleanTagMembro = m.tag.replace('#', '').trim();
        
        // Pega o Elo do jogador com tratamento de falhas
        const eloRanked = await obterEloJogador(cleanTagMembro);

        listaTemp.push({
          tag: m.tag,
          name: m.name,
          trophies: m.trophies || 0,
          pontos: eloRanked > 0 ? eloRanked : (m.trophies || 0),
          eloRanked: eloRanked,
          clubName: clube.nome
        });

        // Atualiza a lista na memória a cada jogador mapeado
        rankingCache = [...listaTemp].sort((a, b) => b.pontos - a.pontos);

        // Pausa de 1.5s entre cada jogador para respeitar limites
        await delay(1500);
      }
    } catch (err) {
      console.log(`❌ Erro crítico no clube ${clube.nome}:`, err.message);
    }
  }

  console.log(`🚀 [FINALIZADO] ${rankingCache.length} jogadores atualizados com sucesso!`);
  processando = false;
}

app.get('/api/ranking', (req, res) => {
  res.json(rankingCache);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  atualizarCacheComFila();
  setInterval(atualizarCacheComFila, 30 * 60 * 1000);
});
