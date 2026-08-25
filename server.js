const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, ".")));

// ======================================================
// CONFIGURAÇÃO DOS 8 CLUBES
// ======================================================

const CLUBES = [
    { tag: "CQYU8RQP", nome: "BBR | Elite" },
    { tag: "2Q8LGGUQY", nome: "BBR | Mestres" },
    { tag: "820QG8Q2V", nome: "BBR | Lendário" },
    { tag: "2LVV8J8C8", nome: "BBR | Mítico" },
    { tag: "80GYP9LCG", nome: "BBR | Diamante" },
    { tag: "80LJYQ982", nome: "BBR | Ouro" },
    { tag: "80VCJU8LV", nome: "BBR | Prata" },
    { tag: "2CRUQ29LL", nome: "BBR | Bronze" }
];

// ======================================================
// CACHE
// ======================================================

let rankingCache = [];
let ultimaAtualizacao = null;
let atualizando = false;

// ======================================================
// BUSCAR MEMBROS DOS CLUBES
// ======================================================

async function buscarMembrosDosClubes() {

    const jogadores = new Map();

    for (const clube of CLUBES) {

        try {

            console.log(`🔎 Buscando clube: ${clube.nome}`);

            const url = `https://api.brawlapi.com/v1/clubs/%23${clube.tag}`;

            const resposta = await axios.get(url, {
                timeout: 15000
            });

            const membros = resposta.data?.members || [];

            console.log(
                `   👥 ${membros.length} jogadores encontrados`
            );

            for (const membro of membros) {

                const tag = membro.tag;

                if (!tag) continue;

                // Evita jogador duplicado
                if (!jogadores.has(tag)) {

                    jogadores.set(tag, {

                        tag: tag,

                        name: membro.name || "Desconhecido",

                        trophies: Number(membro.trophies || 0),

                        // ==================================
                        // RANQUEADA
                        // ==================================
                        //
                        // IMPORTANTE:
                        // A Brawl Stars API não fornece
                        // diretamente o Elo atual aqui.
                        //
                        rankedPoints: null,
                        rankedRank: null,
                        rankedHighest: null,

                        clubName: clube.nome

                    });

                } else {

                    console.log(
                        `⚠️ Jogador duplicado ignorado: ${tag}`
                    );

                }
            }

        } catch (erro) {

            console.error(
                `❌ Erro no clube ${clube.nome}:`,
                erro.response?.data || erro.message
            );
        }
    }

    return Array.from(jogadores.values());
}

// ======================================================
// ATUALIZAR RANKING
// ======================================================

async function atualizarCacheRanking() {

    if (atualizando) {

        console.log("⏳ Atualização já está acontecendo.");

        return;
    }

    atualizando = true;

    try {

        console.log("");
        console.log("========================================");
        console.log("🔄 ATUALIZANDO RANKING");
        console.log("========================================");

        const jogadores = await buscarMembrosDosClubes();

        if (jogadores.length === 0) {

            console.log(
                "⚠️ Nenhum jogador foi encontrado."
            );

            return;
        }

        rankingCache = jogadores;

        ultimaAtualizacao = new Date();

        console.log("");
        console.log(
            `✅ ${rankingCache.length} jogadores carregados.`
        );

        console.log(
            `🕒 Atualizado em: ${ultimaAtualizacao.toLocaleString("pt-BR")}`
        );

        console.log("========================================");
        console.log("");

    } catch (erro) {

        console.error(
            "❌ Erro geral:",
            erro.message
        );

    } finally {

        atualizando = false;
    }
}

// ======================================================
// API DO RANKING
// ======================================================

app.get("/api/ranking", (req, res) => {

    res.json({

        atualizadoEm: ultimaAtualizacao,

        totalJogadores: rankingCache.length,

        jogadores: rankingCache

    });

});

// ======================================================
// STATUS DO SERVIDOR
// ======================================================

app.get("/api/status", (req, res) => {

    res.json({

        online: true,

        jogadores: rankingCache.length,

        ultimaAtualizacao: ultimaAtualizacao,

        clubesMonitorados: CLUBES.length

    });

});

// ======================================================
// PÁGINA PRINCIPAL
// ======================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});

// ======================================================
// INICIAR SERVIDOR
// ======================================================

const PORT = process.env.PORT || 10000;

app.listen(PORT, async () => {

    console.log("");
    console.log("🚀 BBR RANKING");
    console.log(
        `🌐 Servidor iniciado na porta ${PORT}`
    );

    await atualizarCacheRanking();

    // Atualiza a cada 10 minutos
    setInterval(
        atualizarCacheRanking,
        10 * 60 * 1000
    );

});
