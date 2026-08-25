document.addEventListener('DOMContentLoaded', () => {
  const tabelaCorpo = document.querySelector('tbody');
  const seletorOrdenacao = document.getElementById('ordenar');
  let jogadoresGlobais = [];

  async function carregarRanking() {
    try {
      // Usa rota relativa para funcionar tanto no Render quanto no localhost
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
      
      const opcaoAtual = seletorOrdenacao ? seletorOrdenacao.value : 'trofeus';
      ordenarEExibir(opcaoAtual);
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

  function ordenarEExibir(criterio) {
    let lista = [...jogadoresGlobais];

    if (criterio === 'pontos') {
      lista.sort((a, b) => b.pontos - a.pontos);
    } else {
      lista.sort((a, b) => b.trophies - a.trophies);
    }

    renderizarTabela(lista);
  }

  if (seletorOrdenacao) {
    seletorOrdenacao.addEventListener('change', (e) => {
      ordenarEExibir(e.target.value);
    });
  }

  carregarRanking();
});
