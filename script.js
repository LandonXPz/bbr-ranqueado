document.addEventListener('DOMContentLoaded', () => {
  const tabelaCorpo = document.querySelector('tbody');
  const seletorOrdenacao = document.getElementById('ordenar');
  let jogadoresGlobais = [];

  const API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImQyYWI0Y2Y4LTYyNTMtNDE2YS1hZGJiLWRmYjcyYzcyMzBkOCIsImlhdCI6MTc4NzY2MDA1OSwic3ViIjoiZGV2ZWxvcGVyL2RhZDhiYWZiLWViMjItNDQwMC04YTU0LTdjOTU5N2M5YTAyZSIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiMTc3LjE5MS42MC4yMDEiXSwidHlwZSI6ImNsaWVudCJ9XX0.Yg8r0FqJrRqsa-5z9vUudXxmw6Bvbar8Mhdthd3Yu7yzcISNEW4NxgN_VbIOHQlyqJKugHswEH2zhHU4tErZWg";

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

  async function carregarRanking() {
    try {
      jogadoresGlobais = [];

      for (const clube of CLUBES) {
        const resposta = await fetch(`https://api.brawlstars.com/v1/clubs/%23${clube.tag}/members`, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        });

        if (!resposta.ok) continue;

        const dados = await resposta.json();
        if (dados.items) {
          dados.items.forEach(membro => {
            jogadoresGlobais.push({
              tag: membro.tag,
              name: membro.name,
              trophies: membro.trophies || 0,
              pontos: membro.trophies || 0,
              clubName: clube.nome
            });
          });
        }
      }

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
              Erro ao conectar com a API.
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
