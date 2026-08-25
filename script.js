document.addEventListener("DOMContentLoaded", () => {
    const tabelaCorpo = document.querySelector("tbody");
    const seletorOrdenacao = document.getElementById("ordenar");
    let jogadoresGlobais = [];

    // ==================================================
    // CARREGAR RANKING DO BACK-END
    // ==================================================
    async function carregarRanking() {
        try {
            const resposta = await fetch("/api/ranking");
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

            const dados = await resposta.json();
            
            // Lê o array enviado diretamente pelo servidor
            jogadoresGlobais = Array.isArray(dados) ? dados : (dados.jogadores || []);

            console.log(`✅ ${jogadoresGlobais.length} jogadores recebidos`);

            if (jogadoresGlobais.length === 0) {
                mostrarMensagem("Nenhum jogador encontrado. Aguarde a atualização do servidor.");
                return;
            }

            const opcaoAtual = seletorOrdenacao?.value || "ranked";
            ordenarEExibir(opcaoAtual);
        } catch (erro) {
            console.error("❌ Erro ao buscar ranking:", erro);
            mostrarMensagem("Erro ao conectar com o servidor.");
        }
    }

    function mostrarMensagem(mensagem) {
        if (!tabelaCorpo) return;
        tabelaCorpo.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:30px;">
                    ${mensagem}
                </td>
            </tr>
        `;
    }

    // ==================================================
    // RENDERIZAR TABELA NA TELA
    // ==================================================
    function renderizarTabela(jogadores) {
        if (!tabelaCorpo) return;
        tabelaCorpo.innerHTML = "";

        jogadores.forEach((jogador, index) => {
            const linha = document.createElement("tr");

            // Define os ícones ou números para as posições
            let posicao = `#${index + 1}`;
            if (index === 0) posicao = "🥇";
            else if (index === 1) posicao = "🥈";
            else if (index === 2) posicao = "🥉";

            // Formatação do número de Troféus
            const trofeus = Number(jogador.trophies || 0).toLocaleString("pt-BR");

            // Renderiza as colunas de forma limpa
            linha.innerHTML = `
                <td>${posicao}</td>
                <td>
                    <strong>${escaparHTML(jogador.name)}</strong><br>
                    <small>${escaparHTML(jogador.tag)}</small>
                </td>
                <td><strong>${jogador.elo}</strong></td>
                <td>${trofeus}</td>
                <td>${escaparHTML(jogador.clubName)}</td>
            `;

            tabelaCorpo.appendChild(linha);
        });
    }

    // ==================================================
    // SISTEMA DE ORDENAÇÃO
    // ==================================================
    function ordenarEExibir(criterio) {
        let lista = [...jogadoresGlobais];

        if (criterio === "ranked") {
            // Ordena usando o ID numérico do Elo gerado no back-end
            lista.sort((a, b) => Number(b.eloId || 0) - Number(a.eloId || 0));
        } else if (criterio === "trofeus") {
            // Ordena por troféus tradicionais
            lista.sort((a, b) => Number(b.trophies || 0) - Number(a.trophies || 0));
        } else if (criterio === "nome") {
            // Ordena em ordem alfabética de A-Z
            lista.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        }

        renderizarTabela(lista);
    }

    function escaparHTML(texto) {
        const div = document.createElement("div");
        div.textContent = texto ?? "";
        return div.innerHTML;
    }

    // Escuta as alterações no elemento <select> de ordenação
    if (seletorOrdenacao) {
        seletorOrdenacao.addEventListener("change", (evento) => {
            ordenarEExibir(evento.target.value);
        });
    }

    // Inicializa a tabela e atualiza os dados visuais a cada 60 segundos
    carregarRanking();
    setInterval(carregarRanking, 60 * 1000);
});
