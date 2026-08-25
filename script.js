document.addEventListener("DOMContentLoaded", () => {

    const tabelaCorpo = document.querySelector("tbody");
    const seletorOrdenacao = document.getElementById("ordenar");

    let jogadoresGlobais = [];

    // ==================================================
    // CARREGAR RANKING
    // ==================================================

    async function carregarRanking() {

        try {

            const resposta = await fetch("/api/ranking");

            if (!resposta.ok) {

                throw new Error(
                    `HTTP ${resposta.status}`
                );

            }

            const dados = await resposta.json();

            jogadoresGlobais = dados.jogadores || [];

            console.log(
                `✅ ${jogadoresGlobais.length} jogadores recebidos`
            );

            // ==========================================
            // NENHUM JOGADOR
            // ==========================================

            if (jogadoresGlobais.length === 0) {

                mostrarMensagem(
                    "Nenhum jogador encontrado. Aguarde a atualização do servidor."
                );

                return;
            }

            // ==========================================
            // ORDENAR
            // ==========================================

            const opcaoAtual =
                seletorOrdenacao?.value || "ranked";

            ordenarEExibir(opcaoAtual);

        } catch (erro) {

            console.error(
                "❌ Erro ao buscar ranking:",
                erro
            );

            mostrarMensagem(
                "Erro ao conectar com o servidor."
            );

        }
    }

    // ==================================================
    // MENSAGEM
    // ==================================================

    function mostrarMensagem(mensagem) {

        if (!tabelaCorpo) return;

        tabelaCorpo.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >
                    ${mensagem}
                </td>
            </tr>
        `;
    }

    // ==================================================
    // RENDERIZAR TABELA
    // ==================================================

    function renderizarTabela(jogadores) {

        if (!tabelaCorpo) return;

        tabelaCorpo.innerHTML = "";

        jogadores.forEach((jogador, index) => {

            const linha = document.createElement("tr");

            // ------------------------------------------
            // POSIÇÃO
            // ------------------------------------------

            let posicao = `#${index + 1}`;

            if (index === 0) {
                posicao = "🥇";
            }

            else if (index === 1) {
                posicao = "🥈";
            }

            else if (index === 2) {
                posicao = "🥉";
            }

            // ------------------------------------------
            // ELO
            // ------------------------------------------

            let pontosRanked = "-";

            if (
                jogador.rankedPoints !== null &&
                jogador.rankedPoints !== undefined
            ) {

                pontosRanked =
                    Number(jogador.rankedPoints)
                        .toLocaleString("pt-BR");

            }

            // ------------------------------------------
            // RANK
            // ------------------------------------------

            const rank =
                jogador.rankedRank || "-";

            // ------------------------------------------
            // TROFÉUS
            // ------------------------------------------

            const trofeus =
                Number(jogador.trophies || 0)
                    .toLocaleString("pt-BR");

            // ------------------------------------------
            // HTML
            // ------------------------------------------

            linha.innerHTML = `

                <td>
                    ${posicao}
                </td>

                <td>
                    <strong>
                        ${escaparHTML(jogador.name)}
                    </strong>

                    <br>

                    <small>
                        ${escaparHTML(jogador.tag)}
                    </small>
                </td>

                <td>
                    <strong>
                        ${pontosRanked}
                    </strong>
                </td>

                <td>
                    ${rank}
                </td>

                <td>
                    ${trofeus}
                </td>

                <td>
                    ${escaparHTML(jogador.clubName)}
                </td>

            `;

            tabelaCorpo.appendChild(linha);

        });

    }

    // ==================================================
    // ORDENAÇÃO
    // ==================================================

    function ordenarEExibir(criterio) {

        let lista = [...jogadoresGlobais];

        // ----------------------------------------------
        // ELO RANQUEADA
        // ----------------------------------------------

        if (criterio === "ranked") {

            lista.sort((a, b) => {

                const pontosA =
                    Number(a.rankedPoints || 0);

                const pontosB =
                    Number(b.rankedPoints || 0);

                return pontosB - pontosA;

            });

        }

        // ----------------------------------------------
        // TROFÉUS
        // ----------------------------------------------

        else if (criterio === "trofeus") {

            lista.sort((a, b) => {

                return (
                    Number(b.trophies || 0) -
                    Number(a.trophies || 0)
                );

            });

        }

        // ----------------------------------------------
        // NOME
        // ----------------------------------------------

        else if (criterio === "nome") {

            lista.sort((a, b) => {

                return a.name.localeCompare(
                    b.name,
                    "pt-BR"
                );

            });

        }

        renderizarTabela(lista);

    }

    // ==================================================
    // PROTEÇÃO CONTRA HTML
    // ==================================================

    function escaparHTML(texto) {

        const div =
            document.createElement("div");

        div.textContent =
            texto ?? "";

        return div.innerHTML;

    }

    // ==================================================
    // SELETOR
    // ==================================================

    if (seletorOrdenacao) {

        seletorOrdenacao.addEventListener(
            "change",
            (evento) => {

                ordenarEExibir(
                    evento.target.value
                );

            }
        );

    }

    // ==================================================
    // ATUALIZAÇÃO AUTOMÁTICA DO NAVEGADOR
    // ==================================================

    carregarRanking();

    // Atualiza a tabela a cada 60 segundos
    setInterval(
        carregarRanking,
        60 * 1000
    );

});
