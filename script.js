document.addEventListener('DOMContentLoaded', () => {
  const tabelaCorpo = document.querySelector('tbody');
  const seletorOrdenacao = document.getElementById('ordenar');
  let jogadoresGlobais = [];

  async function carregarRanking() {
    try {
      const resposta = await fetch('http://localhost:3000/api/ranking');
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
      linha.innerHTML = `
        <td>#${index + 1}</td>
        <td>${jogador.name}</td>
        <td>${jogador.pontos > 0 ? jogador.pontos.toLocaleString('pt-BR') : '-'}</td>
        <td>${jogador.trophies.toLocaleString('pt-BR')}</td>
        <td>${jogador.clubName}</td>
      `;
      tabelaCorpo.appendChild(linha);
    });
  }

  function aplicarOrdenacao() {
    if (!seletorOrdenacao) return;

    // Cria uma cópia do array para não alterar o original
    let listaOrdenada = [...jogadoresGlobais];
    const criterio = seletorOrdenacao.value;

    if (criterio === 'pontos' || criterio === 'Pontos') {
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