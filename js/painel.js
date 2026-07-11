console.log("PAINEL GRADE JS CARREGOU");

const el = {
  painelDia: document.getElementById("painelDia"),
  painelHorario: document.getElementById("painelHorario"),
  painelTurno: document.getElementById("painelTurno"),
  painelData: document.getElementById("painelData"),
  painelHoraAtual: document.getElementById("painelHoraAtual"),
  painelGrade: document.getElementById("painelGrade"),
  painelVazio: document.getElementById("painelVazio"),
  painelPagina: document.getElementById("painelPagina"),
  painelAvisos: document.getElementById("painelAvisos"),

  // aviso flutuante
};

let presencas = {};
let avisos = [];
let paginaAtual = 0;
let apiBaseUrl = "";

const horariosTurmas = {
  ...turmasMatutino,
  ...turmasVespertino,
  ...turmasNoturno
};

const TEMPO_TROCA_PAGINA = 8000;

// ======================================================
// GRADE RESPONSIVA (colunas/linhas conforme tela e qtd. de turmas)
// ======================================================

// Largura mínima confortável para um card de turma.
const LARGURA_MIN_CARD = 165;

// Altura fixa do card (não estica): grande o bastante pro conteúdo real
// (turma + disciplina), ajustada por faixa de tela — acompanha os mesmos
// breakpoints de fonte/padding já usados no CSS (1400px e 640px).
// Altura ideal que PREENCHE o espaço disponível, limitada entre
// um mínimo legível e um máximo confortável.
// Chamada DEPOIS de saber quantas linhas o grid vai ter.
function calcularAlturaCard(rows, gapPx, alturaDisponivel) {
  const ALTURA_MIN = 88;
  const ALTURA_MAX = 180;
  if (!alturaDisponivel || rows <= 0) return 110;
  const ideal = Math.floor((alturaDisponivel - (rows - 1) * gapPx) / rows);
  return Math.max(ALTURA_MIN, Math.min(ALTURA_MAX, ideal));
}

// Altura estimada — usada apenas em obterLimitesGrade() para
// calcular maxRows antes de conhecer o layout final.
function obterAlturaCard() {
  const w = window.innerWidth;
  if (w < 640)  return 90;
  if (w < 1400) return 100;
  return 110;
}

// Lê o gap real definido no CSS (que também varia por breakpoint),
// em vez de assumir um valor fixo que poderia ficar desatualizado.
function obterGapAtual() {
  const valor = parseFloat(getComputedStyle(el.painelGrade).rowGap);
  return Number.isFinite(valor) ? valor : 20;
}

// Calcula quantas colunas/linhas cabem de fato no espaço disponível,
// medindo o tamanho real do container em vez de "esticar" os cards
// pra preencher a tela toda.
function obterLimitesGrade() {
  const larguraTela = window.innerWidth;
  const gap = obterGapAtual();
  const alturaCard = obterAlturaCard();

  // Em telas pequenas o painel passa a rolar (ver CSS), então não há
  // necessidade de limitar linhas: tudo cabe numa única coluna.
  if (larguraTela < 640) {
    return { maxCols: 1, maxRows: 999 };
  }

  const wrap = el.painelGrade.parentElement;
  const larguraDisponivel = wrap ? wrap.clientWidth : larguraTela;
  const alturaDisponivel = wrap ? wrap.clientHeight : 0;

  const maxCols = Math.max(
    1,
    Math.floor((larguraDisponivel + gap) / (LARGURA_MIN_CARD + gap))
  );

  const maxRows = alturaDisponivel > 0
    ? Math.max(1, Math.floor((alturaDisponivel + gap) / (alturaCard + gap)))
    : 4; // fallback antes do primeiro layout (medida ainda não disponível)

  return { maxCols, maxRows };
}

function obterItensPorPagina() {
  const { maxCols, maxRows } = obterLimitesGrade();
  return maxCols * maxRows;
}

// Escolhe a combinação cols x rows que melhor acomoda "n" itens:
// preferindo o menor número de espaços vazios e, em caso de empate,
// um layout mais "paisagem" (mais colunas que linhas).
function calcularGrade(n, maxCols, maxRows) {
  if (n <= 0) return { cols: 1, rows: 1 };

  let melhor = null;

  for (let cols = 1; cols <= maxCols; cols++) {
    const rows = Math.min(maxRows, Math.ceil(n / cols));
    if (rows * cols < n) continue;

    const vazias = rows * cols - n;

    if (
      !melhor ||
      vazias < melhor.vazias ||
      (vazias === melhor.vazias && cols > melhor.cols)
    ) {
      melhor = { cols, rows, vazias };
    }
  }

  return melhor || { cols: maxCols, rows: maxRows };
}

// ======================================================
// HELPERS
// ======================================================

function norm(s) {
  return (s || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function diaSemanaKey() {
  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  return dias[new Date().getDay()];
}

function nomeDiaSemana(diaKey) {
  const mapa = { dom: "Domingo", seg: "Segunda-feira", ter: "Terça-feira", qua: "Quarta-feira", qui: "Quinta-feira", sex: "Sexta-feira", sab: "Sábado" };
  return mapa[diaKey] || diaKey;
}

function nomeTurno(turno) {
  const mapa = { matutino: "Matutino", vespertino: "Vespertino", noturno: "Noturno" };
  return mapa[turno] || turno;
}

function horaParaMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function minutosAgora() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function textoHorarioPainel(faixa) {
  if (!faixa) return "Fora do turno";
  if (faixa.horario === "intervalo") return "Intervalo";
  return `${faixa.horario}º horário`;
}

// ======================================================
// API
// ======================================================

async function carregarConfiguracaoApi() {
  const hostname = window.location.hostname;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.");
  
  if (isLocal) {
    apiBaseUrl = "";
    console.log("Rodando localmente. API Base URL padrão: relativa");
    return;
  }

  try {
    const snap = await firebase.database().ref("config/tunnel_url").once("value");
    const url = snap.val();
    if (url) {
      apiBaseUrl = url.endsWith("/") ? url : url + "/";
      console.log("Configuração de API carregada do Firebase (Túnel):", apiBaseUrl);
    } else {
      console.warn("URL do túnel não configurada no Firebase.");
    }
  } catch (e) {
    console.warn("Erro ao buscar URL do túnel no Firebase:", e);
  }
}

async function apiGet(url) {
  const finalUrl = url.startsWith("/") && apiBaseUrl ? apiBaseUrl + url.slice(1) : url;
  const resposta = await fetch(finalUrl);
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Erro na API");
  return dados;
}

// ======================================================
// PRESENÇAS
// ======================================================

async function carregarPresencasLocais() {
  const dados = await apiGet(`/api/presencas?data=${encodeURIComponent(todayKey())}`);
  presencas = {};
  (dados.presencas || []).forEach(p => {
    presencas[p.uid] = p;
  });
}



// ======================================================
// REGRAS DE NEGÓCIO E RENDER
// ======================================================

function descobrirFaixaAtual() {
  const agora = minutosAgora();
  for (const [turno, faixas] of Object.entries(horariosTurnos)) {
    for (const [chave, faixa] of Object.entries(faixas)) {
      const ini = horaParaMinutos(faixa.inicio);
      const fim = horaParaMinutos(faixa.fim);
      if (agora >= ini && agora < fim) {
        return { turno, horario: chave === "intervalo" ? "intervalo" : Number(chave) };
      }
    }
  }
  return null;
}

function algumProfessorPresente(listaProfessores = []) {
  return listaProfessores.some(nomeProfessor => {
    const nomeNorm = norm(nomeProfessor);
    return Object.values(presencas).some(p =>
      p.status === "Presente" && norm(p.nome) === nomeNorm
    );
  });
}

function montarListaAtual() {
  const dia = diaSemanaKey();
  if (dia === "sab" || dia === "dom") return { faixa: null, lista: [] };

  const faixa = descobrirFaixaAtual();
  if (!faixa) return { faixa: null, lista: [] };

  let lista = Object.values(horariosTurmas).filter(t => t.turno === faixa.turno);

  const quadros = lista.map(turma => {
    let aula = null;
    if (typeof faixa.horario === "number") {
      aula = turma?.dias?.[dia]?.[faixa.horario] || null;
    }

    let classeCor = "cinza";
    let disciplina = "Sem aula";

    if (faixa.horario === "intervalo") {
      disciplina = "Intervalo";
    } else if (aula) {
      disciplina = aula.disciplina || "-";
      const listaProfessores = Array.isArray(aula.professores) ? aula.professores : (aula.professor ? (Array.isArray(aula.professor) ? aula.professor : [aula.professor]) : []);
      // Os nomes dos professores são usados apenas para checar presença;
      // não são exibidos no painel (privacidade/ética profissional).
      classeCor = algumProfessorPresente(listaProfessores) ? "verde" : "vermelho";
    }

    return { turma: turma.turma, classeCor, disciplina };
  });

  quadros.sort((a, b) => norm(a.turma).localeCompare(norm(b.turma)));

  return { faixa, lista: quadros };
}

function paginar(lista, itensPorPagina) {
  const paginas = [];
  for (let i = 0; i < lista.length; i += itensPorPagina) {
    paginas.push(lista.slice(i, i + itensPorPagina));
  }
  return paginas;
}

function render() {
  const agora = new Date();
  const dia = diaSemanaKey();
  const { faixa, lista } = montarListaAtual();

  el.painelDia.textContent = nomeDiaSemana(dia);
  el.painelHorario.textContent = textoHorarioPainel(faixa);
  el.painelTurno.textContent = faixa ? nomeTurno(faixa.turno) : "Sem turno";
  el.painelData.textContent = agora.toLocaleDateString("pt-BR");
  el.painelHoraAtual.textContent = agora.toLocaleTimeString("pt-BR");

  if (!faixa || lista.length === 0) {
    el.painelGrade.innerHTML = "";
    el.painelGrade.style.display = "none";
    el.painelVazio.style.display = "flex";
    el.painelPagina.textContent = "Página 1/1";
    return;
  }

  el.painelVazio.style.display = "none";
  el.painelGrade.style.display = "grid";

  const { maxCols, maxRows } = obterLimitesGrade();
  const itensPorPagina = maxCols * maxRows;

  const paginas = paginar(lista, itensPorPagina);
  paginaAtual = paginaAtual >= paginas.length ? 0 : paginaAtual;
  const pagina = paginas[paginaAtual] || [];

  const grade = calcularGrade(pagina.length, maxCols, maxRows);

  // Calcula a altura real que preenche o espaço disponível no wrap.
  // 36px = padding interno do painel-grade-wrap (18px top + 18px bottom).
  const gap = obterGapAtual();
  const alturaDispWrap = el.painelGrade.parentElement
    ? Math.max(0, el.painelGrade.parentElement.clientHeight - 36)
    : 0;
  const alturaCard = calcularAlturaCard(grade.rows, gap, alturaDispWrap);

  el.painelGrade.style.gridTemplateColumns = `repeat(${grade.cols}, 1fr)`;
  el.painelGrade.style.gridTemplateRows = `repeat(${grade.rows}, ${alturaCard}px)`;
  el.painelGrade.style.alignContent = "center";

  el.painelGrade.innerHTML = pagina.map(item => `
      <article class="painel-quadro ${item.classeCor}">
        <div class="painel-turma">${item.turma}</div>
        <div class="painel-conteudo">
          <div class="painel-linha">
            <span class="painel-label">Disciplina:</span>
            <span class="painel-valor">${item.disciplina}</span>
          </div>
        </div>
      </article>
    `).join("");

  el.painelPagina.textContent = `Página ${paginaAtual + 1}/${paginas.length}`;
}

// ======================================================
// SEGURANÇA — SANITIZAÇÃO DE HTML
// Qualquer dado vindo do Firebase (avisos, eventos)
// passa por aqui antes de ser inserido no innerHTML.
// Impede XSS caso algum conteúdo malicioso seja
// publicado por uma conta comprometida.
// ======================================================

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#39;");
}

// ======================================================
// AVISOS — LISTENER FIREBASE EM TEMPO REAL
// (completamente separado da lógica de turmas)
// ======================================================

function iniciarAvisosFirebase() {
  const painelAvisos = document.getElementById("painelAvisos");
  if (!painelAvisos) return;

  firebase.database().ref("avisos").on("value",
    (snap) => {
      const dados = snap.val() || {};
      const hoje = todayKey();

      // Filtra apenas avisos válidos (não expirados)
      const ativos = Object.entries(dados)
        .map(([id, a]) => ({ id, ...a }))
        .filter(a => a.expiracao >= hoje)
        .sort((a, b) => {
          const ordem = { urgente: 0, normal: 1, informativo: 2 };
          const pa = ordem[a.prioridade] ?? 1;
          const pb = ordem[b.prioridade] ?? 1;
          if (pa !== pb) return pa - pb;
          return a.expiracao.localeCompare(b.expiracao);
        });

      renderAvisosNoPainel(painelAvisos, ativos);
    },
    (error) => {
      console.warn("Erro ao ouvir avisos do Firebase:", error);
    }
  );
}

function renderAvisosNoPainel(container, ativos) {
  if (ativos.length === 0) {
    container.innerHTML = `
      <div class="painel-lateral-vazio">
        Nenhum aviso no momento
      </div>`;
    return;
  }

  container.innerHTML = ativos.map(aviso => {
    // Sanitiza TUDO que vem do Firebase antes de injetar no DOM
    const titulo   = escapeHtml(aviso.titulo);
    const mensagem = escapeHtml(aviso.mensagem);
    const priori   = escapeHtml(aviso.prioridade);
    const dataFmt  = escapeHtml(aviso.expiracao.split("-").reverse().join("/"));

    // Label de prioridade vem de um mapa fixo — nunca do Firebase diretamente
    const labelMap = { urgente: "⚠️ Urgente", normal: "📌 Normal", informativo: "ℹ️ Info" };
    const label    = labelMap[aviso.prioridade] || escapeHtml(aviso.prioridade);

    // Classe CSS vem do mapa fixo — nunca concatenada direto do Firebase
    const classeValida = ["urgente", "normal", "informativo"].includes(aviso.prioridade)
      ? aviso.prioridade : "informativo";

    return `
      <div class="painel-aviso-item ${classeValida}">
        <div class="painel-aviso-item-topo">
          <span class="painel-aviso-badge ${classeValida}">${label}</span>
          <span class="painel-aviso-expira">até ${dataFmt}</span>
        </div>
        <div class="painel-aviso-item-titulo">${titulo}</div>
        <div class="painel-aviso-item-msg">${mensagem}</div>
      </div>
    `;
  }).join("");
}

// ======================================================
// EVENTOS — LISTENER FIREBASE EM TEMPO REAL
// (completamente separado da lógica de turmas e de avisos)
// ======================================================

function iniciarEventosFirebase() {
  const painelEventos = document.getElementById("painelEventos");
  if (!painelEventos) return;

  firebase.database().ref("eventos").on("value",
    (snap) => {
      const dados = snap.val() || {};
      const hoje = todayKey();

      // Apenas eventos com data >= hoje, em ordem cronológica
      const proximos = Object.entries(dados)
        .map(([id, e]) => ({ id, ...e }))
        .filter(e => e.data >= hoje)
        .sort((a, b) => a.data.localeCompare(b.data));

      renderEventosNoPainel(painelEventos, proximos);
    },
    (error) => {
      console.warn("Erro ao ouvir eventos do Firebase:", error);
    }
  );
}

function renderEventosNoPainel(container, proximos) {
  if (proximos.length === 0) {
    container.innerHTML = `
      <div class="painel-lateral-vazio">
        Nenhum evento programado
      </div>`;
    return;
  }

  container.innerHTML = proximos.map(evento => {
    // Sanitiza TUDO que vem do Firebase
    const titulo   = escapeHtml(evento.titulo);
    const descricao = escapeHtml(evento.descricao);

    // Formata data a partir do valor bruto (já validado como YYYY-MM-DD no gestão)
    const partes = String(evento.data || "").split("-");
    if (partes.length !== 3) return ""; // dado malformado — ignora
    const anoAtual = new Date().getFullYear().toString();
    const dataFmt  = partes[0] === anoAtual
      ? `${partes[2]}/${partes[1]}`
      : `${partes[2]}/${partes[1]}/${partes[0]}`;

    // Quantos dias faltam
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataEvento = new Date(evento.data + "T00:00:00");
    const diffMs  = dataEvento - hoje;
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // labelDias vem de lógica local — não do Firebase
    let labelDias;
    if (diffDias === 0)      labelDias = "Hoje";
    else if (diffDias === 1) labelDias = "Amanhã";
    else                     labelDias = `em ${diffDias} dias`;

    return `
      <div class="painel-evento-item">
        <div class="painel-evento-data-bloco">
          <span class="painel-evento-data">${dataFmt}</span>
          <span class="painel-evento-dias">${labelDias}</span>
        </div>
        <div class="painel-evento-corpo">
          <div class="painel-evento-titulo">${titulo}</div>
          ${descricao ? `<div class="painel-evento-desc">${descricao}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

// ======================================================
// START
// ======================================================

async function start() {
  // 0. Carregar configuração do túnel Cloudflare
  await carregarConfiguracaoApi();

  // 1. Relógio e Render da Grade (1s)
  setInterval(() => { render(); }, 1000);

  // 2. Atualizar Dados da API (10s)
  setInterval(async () => {
    try {
      await carregarPresencasLocais();
    } catch (e) {
      console.error("Erro ao buscar API:", e);
    }
  }, 3000);

  // 3. Troca Automática de Páginas
  setInterval(() => {
    const { lista } = montarListaAtual();
    const itensPorPagina = obterItensPorPagina();
    const paginas = paginar(lista, itensPorPagina);
    if (paginas.length > 1) {
      paginaAtual = (paginaAtual + 1) % paginas.length;
    }
  }, TEMPO_TROCA_PAGINA);

  // 4. Reagir a mudanças de tamanho de tela (rotação, janela redimensionada, etc.)
  let resizeTimeout = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      paginaAtual = 0;
      render();
    }, 200);
  });

  // Inicialização imediata
  render();
  carregarPresencasLocais();

  // 5. Avisos em tempo real via Firebase (listener permanente, sem polling)
  iniciarAvisosFirebase();

  // 6. Eventos em tempo real via Firebase (listener permanente, sem polling)
  iniciarEventosFirebase();
}

start();