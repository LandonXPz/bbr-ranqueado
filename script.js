const API_URL = '/api/ranking';
let jogadoresDados = [];

document.addEventListener('DOMContentLoaded', () => {
  carregarRanking();
  
  // Atualiza os dados no navegador a cada 2 minutos
  setInterval(carregarRanking, 2 * 60 * 1000);

  // Escuta o seletor de ordenação se existir no seu HTML
  const selectOrdem = document.getElementById('ordenar');
  if (selectOrdem) {
    selectOrdem.addEventListener('change', (e) => {
      ordenarEExibir(e.target.value);
    });
  }

  // Escuta o campo de busca de jogador se existir no seu HTML
  const inputBusca = document.getElementById('busca');
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      filtrarJogadores(e.target.value);
    });
  }
});

async function carregarRanking() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Erro ao buscar ranking');
    
    jogadoresDados = await response.json();
    console.log(`✅ ${jogadoresDados.length} jogadores recebidos`);

    const selectOrdem = document.getElementById('ordenar');
    const criterio = selectOrdem ? selectOrdem.value : 'pontos';
    
    ordenarEExibir(criterio);
  } catch (error) {
    console.error('❌ Erro no frontend:', error);
    exibirErro();
  }
}

function ordenarEExibir(criterio = 'pontos', lista = jogadoresDados) {
  const listaOrdenada = [...lista].sort((a, b) => {
    if (criterio === 'trofeus') return b.trophies - a.trophies;
    if (criterio === 'nome') return a.name.localeCompare(b.name);
    return b.pontos - a.pontos; // Padrão: Pontos / Troféus
  });

  renderizarTabela(listaOrdenada);
}

function renderizarTabela(jogadores) {
  const tabela = document.getElementById('tabela-ranking') || document.querySelector('tbody');
  
  if (!tabela) {
    console.error('❌ Elemento da tabela não encontrado no HTML!');
    return;
  }

  if (jogadores.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px;">
          Nenhum jogador encontrado. Aguarde a atualização do servidor.
        </td>
      </tr>`;
    return;
  }

  tabela.innerHTML = jogadores.map((j, index) => `
    <tr>
      <td><strong>#${index + 1}</strong></td>
      <td><strong>${escaparHtml(j.name)}</strong><br><small style="opacity: 0.7;">${j.tag}</small></td>
      <td><span class="badge-pontos">${j.pontos.toLocaleString('pt-BR')}</span></td>
      <td>${j.trophies.toLocaleString('pt-BR')}</td>
      <td><span class="badge-clube">${escaparHtml(j.clubName)}</span></td>
    </tr>
  `).join('');
}

function filtrarJogadores(termo) {
  const busca = termo.toLowerCase().trim();
  const filtrados = jogadoresDados.filter(j => 
    j.name.toLowerCase().includes(busca) || 
    j.tag.toLowerCase().includes(busca) ||
    j.clubName.toLowerCase().includes(busca)
  );
  ordenarEExibir('pontos', filtrados);
}

function exibirErro() {
  const tabela = document.getElementById('tabela-ranking') || document.querySelector('tbody');
  if (tabela) {
    tabela.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: #ff4d4d; padding: 20px;">
          ❌ Falha ao carregar os dados. O servidor está sincronizando...
        </td>
      </tr>`;
  }
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
