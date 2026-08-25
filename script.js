let jogadoresGlobais = [];

const tabelaCorpo = document.getElementById('tabela-corpo');
const seletorOrdenacao = document.getElementById('ordenar');

async function carregarRanking() {
    try {
        const resposta = await fetch('/api/ranking');
        if (!resposta.ok) throw new Error('Erro ao buscar dados do servidor');
        
        jogadoresGlobais = await resposta.json();
        
        if (jogadoresGlobais.length === 0) {
            if (tabelaCorpo) {
                tabelaCorpo.innerHTML = '<tr><td colspan="5">Atualizando cache do servidor... Aguarde 30 segundos e recarregue.</td></tr>';
            }
            return;
        }

        aplicarOrdenacao();
    } catch (erro) {
        console.error('Erro ao buscar dados:', erro);
        if (tabelaCorpo) {
            tabelaCorpo.innerHTML = '<tr><td colspan="5">Erro ao conectar com o servidor. Tente novamente mais tarde.</td></tr>';
        }
    }
}

function renderizarTabela(jogadores) {
    if (!tabelaCorpo) return;
    tabelaCorpo.innerHTML = '';

    jogadores.forEach((jogador, index) => {
        const linha = document.createElement('tr');

        const pontosFormatados = (jogador.pontos !== undefined && jogador.pontos !== null)
            ? jogador.pontos.toLocaleString('pt-BR')
            : '-';

        const trofeusFormatados = (jogador.trofeus || jogador.trophies || 0).toLocaleString('pt-BR');

        linha.innerHTML = `
            <td>#${index + 1}</td>
            <td>${jogador.nome || jogador.name || 'Desconhecido'}</td>
            <td>${pontosFormatados}</td>
            <td>${trofeusFormatados}</td>
            <td>${jogador.clube || jogador.clubName || ''}</td>
        `;

        tabelaCorpo.appendChild(linha);
    });
}

function aplicarOrdenacao() {
    if (!seletorOrdenacao) return;

    let listaOrdenada = [...jogadoresGlobais];
    const criterio = seletorOrdenacao.value;

    if (criterio === 'pontos') {
        listaOrdenada.sort((a, b) => (Number(b.pontos) || 0) - (Number(a.pontos) || 0));
    } else {
        listaOrdenada.sort((a, b) => (Number(b.trofeus || b.trophies) || 0) - (Number(a.trofeus || a.trophies) || 0));
    }

    renderizarTabela(listaOrdenada);
}

if (seletorOrdenacao) {
    seletorOrdenacao.addEventListener('change', aplicarOrdenacao);
}

// Carrega o ranking ao abrir a página
carregarRanking();
