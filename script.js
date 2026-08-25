document.addEventListener('DOMContentLoaded', () => {
  const tabelaCorpo = document.querySelector('tbody');
  const seletorOrdenacao = document.getElementById('ordenar');
  let jogadoresGlobais = [];

  async function carregarRanking() {
    try {
      const resposta = await fetch('/api/ranking');
      if (!resposta.ok) throw new Error('Erro na rede');

      jogadoresGlobais = await resposta.json();

      if (jogadoresGlobais.length === 0) {
        if (tabelaCorpo) {
          tabelaCorpo.innerHTML = `
            <tr>
              <td colspan="5" style="text-align: center; padding: 20px;">
                Carregando dados da Ranqueada... Aguarde um instante e atualize (F5).
              </td>
            </tr>
          `;
        }
        return;
      }
      
      // Aplica a ordenação inicial com base no valor atual do <select>
      aplicarOrdenacao();
    } catch (erro) {
      console.error('Erro ao buscar dados:', erro);
      if (tabelaCorpo) {
        tabelaCorpo.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 20px;">
              Erro ao conectar com o servidor.
            </td>
          </tr>
        `;
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
            <td>${trofeusFormatados}</td>
            <td>${pontosFormatados}</td>
            <td>${jogador.clube || jogador.clubName || ''}</td>
        `;
        tabelaCorpo.appendChild(linha);
    });
}
      // Ordena estritamente do MAIOR para o MENOR em Pontos
      listaOrdenada.sort((a, b) => Number(b.pontos) - Number(a.pontos));
    } else {
      // Ordena estritamente do MAIOR para o MENOR em Troféus
      listaOrdenada.sort((a, b) => Number(b.trophies) - Number(a.trophies));
    }

    renderizarTabela(listaOrdenada);
  }

  // Evento disparado imediatamente ao mudar o Select no HTML
  if (seletorOrdenacao) {
    seletorOrdenacao.addEventListener('change', aplicarOrdenacao);
  }

  carregarRanking();
});
