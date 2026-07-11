console.log("GESTAO ADMIN JS CARREGADO");

const el = {
  // Status
  dot: document.getElementById("dot-status"),
  status: document.getElementById("text-status"),
  dotBottom: document.getElementById("dot-status-bottom"),
  statusBottom: document.getElementById("text-status-bottom"),
  lastUpdate: document.getElementById("lastUpdate"),

  // Dashboard
  kpiCadastrados: document.getElementById("kpiCadastrados"),
  kpiPresentes: document.getElementById("kpiPresentes"),
  kpiAusentes: document.getElementById("kpiAusentes"),
  kpiSemRegistro: document.getElementById("kpiSemRegistro"),
  ultimosRegistros: document.getElementById("ultimosRegistros"),
  listaAusentes: document.getElementById("listaAusentes"),

  // Cadastro
  cadUid: document.getElementById("cadUid"),
  cadNome: document.getElementById("cadNome"),
  cadAtivo: document.getElementById("cadAtivo"),
  btnSalvarProfessor: document.getElementById("btnSalvarProfessor"),
  msgProfessor: document.getElementById("msgProfessor"),
  editBanner: document.getElementById("editBanner"),
  editBannerNome: document.getElementById("editBannerNome"),
  btnCancelarEdicao: document.getElementById("btnCancelarEdicao"),

  // Lista / busca de professores
  searchInput: document.getElementById("searchInput"),
  tbodyProfessores: document.getElementById("tbodyProfessores"),
  professoresEmpty: document.getElementById("professoresEmpty"),
  msgLista: document.getElementById("msgLista"),

  // Relatórios
  filtroData: document.getElementById("filtroData"),
  filtroProfessor: document.getElementById("filtroProfessor"),
  btnGerarRelatorio: document.getElementById("btnGerarRelatorio"),
  btnExport: document.getElementById("btnExport"),
  tbody: document.getElementById("tbody"),
  empty: document.getElementById("empty"),
  paginacaoInfo: document.getElementById("paginacaoInfo"),
  btnPaginaAnterior: document.getElementById("btnPaginaAnterior"),
  btnPaginaProxima: document.getElementById("btnPaginaProxima"),

  // Modal de confirmação
  confirmModal: document.getElementById("confirmModal"),
  confirmTitle: document.getElementById("confirmTitle"),
  confirmMessage: document.getElementById("confirmMessage"),
  confirmCancel: document.getElementById("confirmCancel"),
  confirmOk: document.getElementById("confirmOk"),

  // Navegação e Layout
  navBtns: document.querySelectorAll(".nav-btn"),
  pageSections: document.querySelectorAll(".page-section"),
  pageTitle: document.getElementById("pageTitle"),
  pageSubtitle: document.getElementById("pageSubtitle"),

  // Avisos
  avisoTitulo: document.getElementById("avisoTitulo"),
  avisoMensagem: document.getElementById("avisoMensagem"),
  avisoPrioridade: document.getElementById("avisoPrioridade"),
  avisoExpiracao: document.getElementById("avisoExpiracao"),
  btnSalvarAviso: document.getElementById("btnSalvarAviso"),
  msgAviso: document.getElementById("msgAviso"),
  tbodyAvisos: document.getElementById("tbodyAvisos"),
  avisosEmpty: document.getElementById("avisosEmpty"),
  msgListaAvisos: document.getElementById("msgListaAvisos"),
  kpiTotalAvisos: document.getElementById("kpiTotalAvisos"),
  kpiAvisosAtivos: document.getElementById("kpiAvisosAtivos"),
  kpiAvisosExpirados: document.getElementById("kpiAvisosExpirados"),

  // Eventos
  eventoTitulo: document.getElementById("eventoTitulo"),
  eventoDescricao: document.getElementById("eventoDescricao"),
  eventoData: document.getElementById("eventoData"),
  btnSalvarEvento: document.getElementById("btnSalvarEvento"),
  msgEvento: document.getElementById("msgEvento"),
  tbodyEventos: document.getElementById("tbodyEventos"),
  eventosEmpty: document.getElementById("eventosEmpty"),
  msgListaEventos: document.getElementById("msgListaEventos"),
  kpiTotalEventos: document.getElementById("kpiTotalEventos"),
  kpiEventosProximos: document.getElementById("kpiEventosProximos"),
  kpiEventosEncerrados: document.getElementById("kpiEventosEncerrados"),

  // Túnel Cloudflare
  inputTunnelUrl: document.getElementById("inputTunnelUrl"),
  btnSalvarTunnelUrl: document.getElementById("btnSalvarTunnelUrl"),
  msgTunnelUrl: document.getElementById("msgTunnelUrl"),
};

const subtitles = {
  dashboard: "Monitoramento em tempo real do sistema",
  professores: "Gerenciamento dos professores cadastrados",
  relatorios: "Exportação e relatórios do sistema",
  avisos: "Publicação de avisos para o painel",
  eventos: "Agenda de eventos institucionais"
};

let usuarios = {};
let presencas = {};
let avisos   = [];
let eventos  = [];
let dataSelecionada = todayKey();

let modoEdicaoUid = null;       // uid do professor em edição, ou null
let professorFiltro = "";       // uid selecionado no filtro do relatório ("" = todos)
let paginaRelatorio = 0;        // página atual da tabela de relatório
const ITENS_POR_PAGINA_RELATORIO = 10;
let apiBaseUrl = "";




/* ========================================
   HELPERS
======================================== */
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nowBRTime() {
  return new Date().toLocaleTimeString("pt-BR");
}

function norm(s) {
  return (s || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getStatusClass(status) {
  switch ((status || "").toLowerCase()) {
    case "presente": return "presente";
    case "ausente": return "ausente";
    default: return "atrasado";
  }
}

/* ========================================
   NAVEGAÇÃO E UI
======================================== */



window.sair = async function () {
  try {
    await firebase.auth().signOut();
  } catch (e) {
    console.error(e);
  }

  window.location.href = "./login-gestao.html";
};

/* ========================================
   MODAL DE CONFIRMAÇÃO (genérico)
======================================== */
function confirmarAcao({
  titulo = "Confirmar ação",
  mensagem = "Tem certeza que deseja continuar?",
  textoConfirmar = "Confirmar",
  tipo = "danger"
} = {}) {
  return new Promise((resolve) => {
    // Fallback caso o modal não exista no HTML por algum motivo
    if (!el.confirmModal) {
      resolve(window.confirm(mensagem));
      return;
    }

    el.confirmTitle.textContent = titulo;
    el.confirmMessage.textContent = mensagem;
    el.confirmOk.textContent = textoConfirmar;
    el.confirmOk.className = tipo === "danger" ? "btn-danger" : "btn-secondary";

    el.confirmModal.classList.remove("hidden");
    requestAnimationFrame(() => el.confirmModal.classList.add("active"));

    function fechar(resultado) {
      el.confirmModal.classList.remove("active");
      setTimeout(() => el.confirmModal.classList.add("hidden"), 200);

      el.confirmOk.removeEventListener("click", onConfirmar);
      el.confirmCancel.removeEventListener("click", onCancelar);
      el.confirmModal.removeEventListener("click", onOverlay);

      resolve(resultado);
    }

    function onConfirmar() { fechar(true); }
    function onCancelar() { fechar(false); }
    function onOverlay(event) {
      if (event.target === el.confirmModal) fechar(false);
    }

    el.confirmOk.addEventListener("click", onConfirmar);
    el.confirmCancel.addEventListener("click", onCancelar);
    el.confirmModal.addEventListener("click", onOverlay);
  });
}



function initNavegacao() {
  // Controle das abas
  el.navBtns.forEach(botao => {
    botao.addEventListener("click", () => {
      const secaoAlvo = botao.dataset.section;

      el.navBtns.forEach(b => b.classList.remove("active"));
      botao.classList.add("active");

      el.pageSections.forEach(sec => sec.classList.remove("active"));
      const sectionElement = document.getElementById(`${secaoAlvo}Section`);
      if (sectionElement) sectionElement.classList.add("active");

      // Atualiza Cabeçalho
      el.pageTitle.innerText = botao.textContent
  .replace(/[^\p{L}\p{N}\s]/gu, "")
  .trim();
      el.pageSubtitle.innerText = subtitles[secaoAlvo] || "";
    });
  });

  // Controle da Sidebar Retrátil

}

/* ========================================
   API MOCK / CALLS
======================================== */
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
  if (!resposta.ok) throw new Error(dados.erro || "Erro API");
  return dados;
}

async function apiSend(url, method, body) {
  const finalUrl = url.startsWith("/") && apiBaseUrl ? apiBaseUrl + url.slice(1) : url;
  const resposta = await fetch(finalUrl, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Erro API");
  return dados;
}

/* ========================================
   STATUS CONEXÃO
======================================== */
function setConnOk() {
  const statusTexts = ["Sistema online", "Conectado"];
  [el.dot, el.dotBottom].forEach(d => { if(d) d.className = "dot presente"; });
  if(el.status) el.status.textContent = statusTexts[0];
  if(el.statusBottom) el.statusBottom.textContent = statusTexts[0];
}

function setConnBad() {
  [el.dot, el.dotBottom].forEach(d => { if(d) d.className = "dot ausente"; });
  if(el.status) el.status.textContent = "Erro conexão";
  if(el.statusBottom) el.statusBottom.textContent = "Desconectado";
}

/* ========================================
   CARREGAMENTO DE DADOS
======================================== */
async function carregarUsuariosLocais() {
  try {
    const dados = await apiGet("/api/usuarios");
    usuarios = {};
    (dados.usuarios || []).forEach(usuario => {
      usuarios[usuario.uid] = {
        nome: usuario.nome,
        ativo: usuario.ativo === 1 || usuario.ativo === true
      };
    });
    atualizarDashboard();
    setConnOk();
  } catch (error) {
    console.warn("API de usuários inacessível, utilizando cache/vazio", error);
    setConnBad();
  }
}

async function carregarPresencasPorData() {
  try {
    const dados = await apiGet(`/api/presencas?data=${encodeURIComponent(dataSelecionada)}`);
    presencas = {};
    (dados.presencas || []).forEach(p => {
      presencas[p.uid] = {
        status: p.status,
        hora_entrada: p.hora_entrada,
        hora_saida: p.hora_saida,
        nome: p.nome
      };
    });
    atualizarDashboard();
    buildTabela();
  } catch (error) {
    console.warn("API de presenças inacessível.", error);
    setConnBad();
  }
}

/* ========================================
   RENDERIZADORES (DASHBOARD)
======================================== */
function atualizarDashboard() {
  const ativos = Object.entries(usuarios).filter(([_, u]) => u.ativo);
  const cadastrados = ativos.length;
  const presentes = ativos.filter(([uid]) => presencas[uid]?.status === "Presente").length;
  const ausentes = ativos.filter(([uid]) => presencas[uid]?.status === "Ausente").length;
  const semRegistro = ativos.filter(([uid]) => !presencas[uid]).length;

  el.kpiCadastrados.textContent = cadastrados;
  el.kpiPresentes.textContent = presentes;
  el.kpiAusentes.textContent = ausentes;
  el.kpiSemRegistro.textContent = semRegistro;

  renderUltimosRegistros();
  renderAusentes();
  renderListaProfessores();
  popularFiltroProfessor();
}

function renderUltimosRegistros() {
  const lista = Object.entries(presencas)
    .map(([uid, p]) => ({ uid, ...p }))
    .sort((a, b) => norm(b.hora_entrada || "").localeCompare(norm(a.hora_entrada || "")))
    .slice(0, 5);

  if (lista.length === 0) {
    el.ultimosRegistros.innerHTML = `
      <div style="text-align:center; padding:20px; color:var(--muted); font-weight:600;">
        Nenhum registro hoje
      </div>`;
    return;
  }

  el.ultimosRegistros.innerHTML = lista.map(item => `
    <div class="mini-card">
      <div>
        <div class="mini-title">${item.nome || "Professor"}</div>
        <div class="mini-sub">🕒 Entrada: <strong>${item.hora_entrada || "--:--"}</strong></div>
      </div>
      <span class="status-badge ${getStatusClass(item.status)}">${item.status}</span>
    </div>
  `).join("");
}

function renderAusentes() {
  const lista = Object.entries(usuarios).filter(([uid, u]) => u.ativo && !presencas[uid]);

  if (lista.length === 0) {
    el.listaAusentes.innerHTML = `
      <div style="text-align:center; padding:20px; color:var(--success); font-weight:700;">
        ✅ Todos os professores presentes!
      </div>`;
    return;
  }

  el.listaAusentes.innerHTML = lista.slice(0, 5).map(([uid, u]) => `
    <div class="mini-card">
      <div>
        <div class="mini-title">${u.nome}</div>
        <div class="mini-sub">UID: ${uid}</div>
      </div>
      <span class="status-badge ausente">Sem Registro</span>
    </div>
  `).join("");
}

/* ========================================
   LISTA / BUSCA DE PROFESSORES
======================================== */
function renderListaProfessores() {
  if (!el.tbodyProfessores) return;

  const termo = norm(el.searchInput ? el.searchInput.value : "");

  const lista = Object.entries(usuarios)
    .filter(([uid, u]) => {
      if (!termo) return true;
      return norm(u.nome).includes(termo) || norm(uid).includes(termo);
    })
    .sort((a, b) => norm(a[1].nome).localeCompare(norm(b[1].nome)));

  if (lista.length === 0) {
    el.tbodyProfessores.innerHTML = "";
    if (el.professoresEmpty) el.professoresEmpty.classList.remove("hidden");
    return;
  }

  if (el.professoresEmpty) el.professoresEmpty.classList.add("hidden");

  el.tbodyProfessores.innerHTML = lista.map(([uid, u]) => `
    <tr>
      <td>${u.nome}</td>
      <td class="mono">${uid}</td>
      <td><span class="status-badge ${u.ativo ? "ativo" : "inativo"}">${u.ativo ? "Ativo" : "Inativo"}</span></td>
      <td class="col-acoes">
        <div class="row-acoes">
          <button type="button" class="btn-icon" data-action="editar" data-uid="${uid}" title="Editar">✏️</button>
          <button type="button" class="btn-icon" data-action="alternar" data-uid="${uid}" title="${u.ativo ? "Desativar" : "Ativar"}">${u.ativo ? "🚫" : "✅"}</button>
          <button type="button" class="btn-icon btn-icon-danger" data-action="excluir" data-uid="${uid}" title="Excluir">🗑️</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function mostrarMsgLista(texto, erro = false) {
  if (!el.msgLista) return;
  el.msgLista.style.color = erro ? "var(--danger)" : "var(--success)";
  el.msgLista.textContent = texto;
  setTimeout(() => {
    if (el.msgLista.textContent === texto) el.msgLista.textContent = "";
  }, 4000);
}

function popularFiltroProfessor() {
  if (!el.filtroProfessor) return;

  const valorAtual = el.filtroProfessor.value;

  const ativos = Object.entries(usuarios)
    .filter(([_, u]) => u.ativo)
    .sort((a, b) => norm(a[1].nome).localeCompare(norm(b[1].nome)));

  el.filtroProfessor.innerHTML = `<option value="">Todos os professores</option>` +
    ativos.map(([uid, u]) => `<option value="${uid}">${u.nome}</option>`).join("");

  const aindaExiste = ativos.some(([uid]) => uid === valorAtual);

  if (valorAtual && aindaExiste) {
    el.filtroProfessor.value = valorAtual;
  } else if (valorAtual && !aindaExiste) {
    // Professor filtrado não está mais ativo (excluído/desativado) — volta para "todos"
    professorFiltro = "";
    paginaRelatorio = 0;
    buildTabela();
  }
}

/* ========================================
   EDIÇÃO DE PROFESSOR
======================================== */
function iniciarEdicaoProfessor(uid) {
  const usuario = usuarios[uid];
  if (!usuario) return;

  modoEdicaoUid = uid;

  el.cadUid.value = uid;
  el.cadNome.value = usuario.nome;
  el.cadAtivo.checked = !!usuario.ativo;
  el.cadUid.disabled = true;

  if (el.editBannerNome) el.editBannerNome.textContent = usuario.nome;
  if (el.editBanner) el.editBanner.classList.remove("hidden");

  el.btnSalvarProfessor.textContent = "Atualizar professor";
  el.msgProfessor.textContent = "";

  el.cadNome.focus();
  el.cadNome.scrollIntoView({ behavior: "smooth", block: "center" });
}

function cancelarEdicaoProfessor() {
  modoEdicaoUid = null;

  el.cadUid.value = "";
  el.cadNome.value = "";
  el.cadAtivo.checked = true;
  el.cadUid.disabled = false;

  if (el.editBanner) el.editBanner.classList.add("hidden");
  el.btnSalvarProfessor.textContent = "Salvar professor";
}

/* ========================================
   ATIVAR / DESATIVAR / EXCLUIR
======================================== */
async function alternarAtivoProfessor(uid) {
  const usuario = usuarios[uid];
  if (!usuario) return;

  try {
    await apiSend("/api/usuarios", "POST", { uid, nome: usuario.nome, ativo: !usuario.ativo });
    mostrarMsgLista(`"${usuario.nome}" foi ${usuario.ativo ? "desativado" : "ativado"}.`);
    await carregarUsuariosLocais();
  } catch (error) {
    console.error(error);
    mostrarMsgLista("Erro ao atualizar status do professor.", true);
  }
}

async function excluirProfessor(uid, nome) {
  const ok = await confirmarAcao({
    titulo: "Excluir professor",
    mensagem: `Tem certeza que deseja excluir "${nome}"? Essa ação não pode ser desfeita.`,
    textoConfirmar: "Excluir",
    tipo: "danger"
  });

  if (!ok) return;

  try {
    await apiSend(`/api/usuarios/${uid}`, "DELETE", {});

    if (modoEdicaoUid === uid) cancelarEdicaoProfessor();

    mostrarMsgLista(`"${nome}" foi excluído.`);
    await carregarUsuariosLocais();
  } catch (error) {
    console.error(error);
    mostrarMsgLista("Erro ao excluir professor.", true);
  }
}

/* ========================================
   TABELA RELATÓRIOS
======================================== */
function obterListaRelatorio() {
  let lista = Object.entries(usuarios)
    .filter(([_, u]) => u.ativo)
    .map(([uid, u]) => {
      const p = presencas[uid] || null;
      return {
        nome: u.nome,
        uid,
        status: p?.status || "Sem registro",
        entrada: p?.hora_entrada || "-",
        saida: p?.hora_saida || "-"
      };
    });

  if (professorFiltro) {
    lista = lista.filter(item => item.uid === professorFiltro);
  }

  lista.sort((a, b) => norm(a.nome).localeCompare(norm(b.nome)));
  return lista;
}

function renderTabelaPaginada(lista) {
  const totalPaginas = Math.max(1, Math.ceil(lista.length / ITENS_POR_PAGINA_RELATORIO));
  paginaRelatorio = Math.min(Math.max(paginaRelatorio, 0), totalPaginas - 1);

  const inicio = paginaRelatorio * ITENS_POR_PAGINA_RELATORIO;
  const pagina = lista.slice(inicio, inicio + ITENS_POR_PAGINA_RELATORIO);

  el.tbody.innerHTML = pagina.map(item => `
    <tr>
      <td>${item.nome}</td>
      <td><span class="status-badge ${getStatusClass(item.status)}">${item.status}</span></td>
      <td class="mono">${item.entrada}</td>
      <td class="mono">${item.saida}</td>
      <td class="mono">${item.uid}</td>
    </tr>
  `).join("");

  el.empty.classList.toggle("hidden", lista.length !== 0);

  atualizarControlesPaginacao(lista.length, totalPaginas);
}

function atualizarControlesPaginacao(totalItens, totalPaginas) {
  if (el.paginacaoInfo) {
    el.paginacaoInfo.textContent = totalItens === 0
      ? "Nenhum resultado"
      : `Página ${paginaRelatorio + 1} de ${totalPaginas} • ${totalItens} registro(s)`;
  }

  if (el.btnPaginaAnterior) el.btnPaginaAnterior.disabled = paginaRelatorio === 0;
  if (el.btnPaginaProxima) el.btnPaginaProxima.disabled = paginaRelatorio >= totalPaginas - 1;
}

function buildTabela() {
  renderTabelaPaginada(obterListaRelatorio());
}

/* ========================================
   EXPORTAR CSV
======================================== */
function exportCSV() {
  const rows = [["Data", "Professor", "Status", "Entrada", "Saida", "UID"]];

  obterListaRelatorio().forEach(item => {
    rows.push([
      dataSelecionada,
      item.nome,
      item.status,
      item.entrada,
      item.saida,
      item.uid
    ]);
  });

  const csv = rows.map(r => r.map(v => `"${v}"`).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  
  a.href = url;
  a.download = `presenx_relatorio_${dataSelecionada}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ========================================
   CADASTRO DE PROFESSORES
======================================== */
async function salvarProfessor() {
  const emEdicao = !!modoEdicaoUid;
  const uid = modoEdicaoUid || (el.cadUid.value || "").trim().toUpperCase();
  const nome = (el.cadNome.value || "").trim();
  const ativo = !!el.cadAtivo.checked;

  el.msgProfessor.textContent = "";

  if (!uid || !nome) {
    el.msgProfessor.style.color = "var(--danger)";
    el.msgProfessor.textContent = "Preencha UID e Nome.";
    return;
  }

  try {
    await apiSend("/api/usuarios", "POST", { uid, nome, ativo });

    cancelarEdicaoProfessor();

    el.msgProfessor.style.color = "var(--success)";
    el.msgProfessor.textContent = emEdicao ? "Professor atualizado com sucesso!" : "Professor salvo com sucesso!";

    carregarUsuariosLocais();
  } catch (error) {
    console.error(error);
    el.msgProfessor.style.color = "var(--danger)";
    el.msgProfessor.textContent = emEdicao ? "Erro ao atualizar professor." : "Erro ao salvar professor.";
  }
}

/* ========================================
   AVISOS — CARREGAR (Firebase Realtime DB)
======================================== */
async function carregarAvisos() {
  try {
    const snap = await firebase.database().ref("avisos").once("value");
    const dados = snap.val() || {};
    avisos = Object.entries(dados).map(([id, a]) => ({ id, ...a }));
    renderListaAvisos();
    atualizarKpisAvisos();
  } catch (error) {
    console.warn("Erro ao carregar avisos do Firebase:", error);
  }
}

/* ========================================
   AVISOS — KPIs
======================================== */
function atualizarKpisAvisos() {
  const hoje = todayKey();
  const ativos = avisos.filter(a => a.expiracao >= hoje);
  const expirados = avisos.filter(a => a.expiracao < hoje);

  if (el.kpiTotalAvisos)    el.kpiTotalAvisos.textContent    = avisos.length;
  if (el.kpiAvisosAtivos)   el.kpiAvisosAtivos.textContent   = ativos.length;
  if (el.kpiAvisosExpirados) el.kpiAvisosExpirados.textContent = expirados.length;
}

/* ========================================
   AVISOS — RENDER LISTA (GESTÃO)
======================================== */
function renderListaAvisos() {
  if (!el.tbodyAvisos) return;

  if (avisos.length === 0) {
    el.tbodyAvisos.innerHTML = "";
    if (el.avisosEmpty) el.avisosEmpty.classList.remove("hidden");
    return;
  }

  if (el.avisosEmpty) el.avisosEmpty.classList.add("hidden");

  const hoje = todayKey();

  const sorted = [...avisos].sort((a, b) => {
    // urgentes primeiro, depois por expiração mais próxima
    const prioOrdem = { urgente: 0, normal: 1, informativo: 2 };
    const pa = prioOrdem[a.prioridade] ?? 1;
    const pb = prioOrdem[b.prioridade] ?? 1;
    if (pa !== pb) return pa - pb;
    return a.expiracao.localeCompare(b.expiracao);
  });

  el.tbodyAvisos.innerHTML = sorted.map(aviso => {
    const ativo = aviso.expiracao >= hoje;
    const dataFmt = aviso.expiracao.split("-").reverse().join("/");
    const msg = aviso.mensagem.length > 60
      ? aviso.mensagem.slice(0, 60) + "…"
      : aviso.mensagem;

    return `
      <tr class="${ativo ? "" : "row-expirado"}">
        <td><strong>${aviso.titulo}</strong></td>
        <td class="aviso-msg-cell">${msg}</td>
        <td><span class="prioridade-badge ${aviso.prioridade}">${labelPrioridade(aviso.prioridade)}</span></td>
        <td class="mono">${dataFmt}</td>
        <td><span class="status-badge ${ativo ? "ativo" : "inativo"}">${ativo ? "Ativo" : "Expirado"}</span></td>
        <td class="col-acoes">
          <div class="row-acoes">
            <button type="button" class="btn-icon btn-icon-danger"
              data-action="excluir-aviso"
              data-id="${aviso.id}"
              title="Excluir aviso">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function labelPrioridade(p) {
  const map = { urgente: "Urgente", normal: "Normal", informativo: "Informativo" };
  return map[p] || p;
}

function mostrarMsgAviso(texto, erro = false) {
  if (!el.msgAviso) return;
  el.msgAviso.style.color = erro ? "var(--danger)" : "var(--success)";
  el.msgAviso.textContent = texto;
  setTimeout(() => {
    if (el.msgAviso.textContent === texto) el.msgAviso.textContent = "";
  }, 4000);
}

function mostrarMsgListaAvisos(texto, erro = false) {
  if (!el.msgListaAvisos) return;
  el.msgListaAvisos.style.color = erro ? "var(--danger)" : "var(--success)";
  el.msgListaAvisos.textContent = texto;
  setTimeout(() => {
    if (el.msgListaAvisos.textContent === texto) el.msgListaAvisos.textContent = "";
  }, 4000);
}

/* ========================================
   AVISOS — SALVAR (Firebase Realtime DB)
======================================== */
async function salvarAviso() {
  const titulo    = (el.avisoTitulo.value || "").trim();
  const mensagem  = (el.avisoMensagem.value || "").trim();
  const prioridade = el.avisoPrioridade.value;
  const expiracao  = el.avisoExpiracao.value;

  mostrarMsgAviso("");

  if (!titulo) {
    mostrarMsgAviso("Preencha o título do aviso.", true);
    el.avisoTitulo.focus();
    return;
  }
  if (titulo.length > 120) {
    mostrarMsgAviso("Título muito longo (máx. 120 caracteres).", true);
    el.avisoTitulo.focus();
    return;
  }
  if (!mensagem) {
    mostrarMsgAviso("Preencha a mensagem do aviso.", true);
    el.avisoMensagem.focus();
    return;
  }
  if (mensagem.length > 600) {
    mostrarMsgAviso("Mensagem muito longa (máx. 600 caracteres).", true);
    el.avisoMensagem.focus();
    return;
  }
  if (!["informativo", "normal", "urgente"].includes(prioridade)) {
    mostrarMsgAviso("Prioridade inválida.", true);
    return;
  }
  if (!expiracao || !/^\d{4}-\d{2}-\d{2}$/.test(expiracao)) {
    mostrarMsgAviso("Selecione uma data de validade válida.", true);
    el.avisoExpiracao.focus();
    return;
  }
  if (expiracao < todayKey()) {
    mostrarMsgAviso("A data de validade não pode ser anterior a hoje.", true);
    el.avisoExpiracao.focus();
    return;
  }

  const btnOriginal = el.btnSalvarAviso.textContent;
  el.btnSalvarAviso.disabled = true;
  el.btnSalvarAviso.textContent = "Publicando…";

  try {
    await firebase.database().ref("avisos").push({
      titulo,
      mensagem,
      prioridade,
      expiracao,
      criadoEm: Date.now()
    });

    el.avisoTitulo.value     = "";
    el.avisoMensagem.value   = "";
    el.avisoPrioridade.value = "normal";
    el.avisoExpiracao.value  = "";

    mostrarMsgAviso("Aviso publicado com sucesso!");
    await carregarAvisos();
  } catch (error) {
    console.error(error);
    mostrarMsgAviso("Erro ao publicar aviso.", true);
  } finally {
    el.btnSalvarAviso.disabled = false;
    el.btnSalvarAviso.textContent = btnOriginal;
  }
}

/* ========================================
   AVISOS — EXCLUIR (Firebase Realtime DB)
======================================== */
async function excluirAviso(id) {
  const aviso = avisos.find(a => a.id === id);
  if (!aviso) return;

  const ok = await confirmarAcao({
    titulo: "Excluir aviso",
    mensagem: `Tem certeza que deseja excluir o aviso "${aviso.titulo}"?`,
    textoConfirmar: "Excluir",
    tipo: "danger"
  });

  if (!ok) return;

  try {
    await firebase.database().ref(`avisos/${id}`).remove();
    mostrarMsgListaAvisos(`Aviso "${aviso.titulo}" excluído.`);
    await carregarAvisos();
  } catch (error) {
    console.error(error);
    mostrarMsgListaAvisos("Erro ao excluir aviso.", true);
  }
}

/* ========================================
   EVENTOS — CARREGAR (Firebase Realtime DB)
======================================== */
async function carregarEventos() {
  try {
    const snap = await firebase.database().ref("eventos").once("value");
    const dados = snap.val() || {};
    eventos = Object.entries(dados).map(([id, e]) => ({ id, ...e }));
    renderListaEventos();
    atualizarKpisEventos();
  } catch (error) {
    console.warn("Erro ao carregar eventos do Firebase:", error);
  }
}

/* ========================================
   EVENTOS — KPIs
======================================== */
function atualizarKpisEventos() {
  const hoje = todayKey();
  const proximos  = eventos.filter(e => e.data >= hoje);
  const encerrados = eventos.filter(e => e.data < hoje);

  if (el.kpiTotalEventos)      el.kpiTotalEventos.textContent     = eventos.length;
  if (el.kpiEventosProximos)   el.kpiEventosProximos.textContent  = proximos.length;
  if (el.kpiEventosEncerrados) el.kpiEventosEncerrados.textContent = encerrados.length;
}

/* ========================================
   EVENTOS — RENDER LISTA (GESTÃO)
======================================== */
function renderListaEventos() {
  if (!el.tbodyEventos) return;

  if (eventos.length === 0) {
    el.tbodyEventos.innerHTML = "";
    if (el.eventosEmpty) el.eventosEmpty.classList.remove("hidden");
    return;
  }

  if (el.eventosEmpty) el.eventosEmpty.classList.add("hidden");

  const hoje = todayKey();

  const sorted = [...eventos].sort((a, b) => a.data.localeCompare(b.data));

  el.tbodyEventos.innerHTML = sorted.map(evento => {
    const proximo = evento.data >= hoje;
    const dataFmt = evento.data.split("-").reverse().join("/");
    const desc = (evento.descricao || "").length > 60
      ? evento.descricao.slice(0, 60) + "…"
      : (evento.descricao || "—");

    return `
      <tr class="${proximo ? "" : "row-expirado"}">
        <td><strong>${evento.titulo}</strong></td>
        <td class="aviso-msg-cell">${desc}</td>
        <td class="mono">${dataFmt}</td>
        <td><span class="status-badge ${proximo ? "ativo" : "inativo"}">${proximo ? "Próximo" : "Encerrado"}</span></td>
        <td class="col-acoes">
          <div class="row-acoes">
            <button type="button" class="btn-icon btn-icon-danger"
              data-action="excluir-evento"
              data-id="${evento.id}"
              title="Excluir evento">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function mostrarMsgEvento(texto, erro = false) {
  if (!el.msgEvento) return;
  el.msgEvento.style.color = erro ? "var(--danger)" : "var(--success)";
  el.msgEvento.textContent = texto;
  setTimeout(() => {
    if (el.msgEvento.textContent === texto) el.msgEvento.textContent = "";
  }, 4000);
}

function mostrarMsgListaEventos(texto, erro = false) {
  if (!el.msgListaEventos) return;
  el.msgListaEventos.style.color = erro ? "var(--danger)" : "var(--success)";
  el.msgListaEventos.textContent = texto;
  setTimeout(() => {
    if (el.msgListaEventos.textContent === texto) el.msgListaEventos.textContent = "";
  }, 4000);
}

/* ========================================
   EVENTOS — SALVAR (Firebase Realtime DB)
======================================== */
async function salvarEvento() {
  const titulo    = (el.eventoTitulo.value || "").trim();
  const descricao = (el.eventoDescricao.value || "").trim();
  const data      = el.eventoData.value;

  mostrarMsgEvento("");

  if (!titulo) {
    mostrarMsgEvento("Preencha o título do evento.", true);
    el.eventoTitulo.focus();
    return;
  }
  if (titulo.length > 120) {
    mostrarMsgEvento("Título muito longo (máx. 120 caracteres).", true);
    el.eventoTitulo.focus();
    return;
  }
  if (descricao.length > 600) {
    mostrarMsgEvento("Descrição muito longa (máx. 600 caracteres).", true);
    el.eventoDescricao.focus();
    return;
  }
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    mostrarMsgEvento("Selecione uma data válida para o evento.", true);
    el.eventoData.focus();
    return;
  }
  if (data < todayKey()) {
    mostrarMsgEvento("Não é possível cadastrar um evento em data passada.", true);
    el.eventoData.focus();
    return;
  }

  const btnOriginal = el.btnSalvarEvento.textContent;
  el.btnSalvarEvento.disabled = true;
  el.btnSalvarEvento.textContent = "Salvando…";

  try {
    await firebase.database().ref("eventos").push({
      titulo,
      descricao,
      data,
      criadoEm: Date.now()
    });

    el.eventoTitulo.value    = "";
    el.eventoDescricao.value = "";
    el.eventoData.value      = "";

    mostrarMsgEvento("Evento salvo com sucesso!");
    await carregarEventos();
  } catch (error) {
    console.error(error);
    mostrarMsgEvento("Erro ao salvar evento.", true);
  } finally {
    el.btnSalvarEvento.disabled = false;
    el.btnSalvarEvento.textContent = btnOriginal;
  }
}

/* ========================================
   EVENTOS — EXCLUIR (Firebase Realtime DB)
======================================== */
async function excluirEvento(id) {
  const evento = eventos.find(e => e.id === id);
  if (!evento) return;

  const ok = await confirmarAcao({
    titulo: "Excluir evento",
    mensagem: `Tem certeza que deseja excluir o evento "${evento.titulo}"?`,
    textoConfirmar: "Excluir",
    tipo: "danger"
  });

  if (!ok) return;

  try {
    await firebase.database().ref(`eventos/${id}`).remove();
    mostrarMsgListaEventos(`Evento "${evento.titulo}" excluído.`);
    await carregarEventos();
  } catch (error) {
    console.error(error);
    mostrarMsgListaEventos("Erro ao excluir evento.", true);
  }
}

/* ========================================
   INICIALIZAÇÃO
======================================== */
async function start() {
  await carregarConfiguracaoApi();
  initNavegacao();
  
  el.filtroData.value = todayKey();
  carregarUsuariosLocais();
  carregarPresencasPorData();

  // Listeners de Relatório e Cadastro
  if (el.btnGerarRelatorio) {
    el.btnGerarRelatorio.addEventListener("click", () => {
      dataSelecionada = el.filtroData.value || todayKey();
      paginaRelatorio = 0;
      carregarPresencasPorData();
    });
  }

  if (el.filtroProfessor) {
    el.filtroProfessor.addEventListener("change", () => {
      professorFiltro = el.filtroProfessor.value;
      paginaRelatorio = 0;
      buildTabela();
    });
  }

  if (el.btnPaginaAnterior) {
    el.btnPaginaAnterior.addEventListener("click", () => {
      paginaRelatorio--;
      buildTabela();
    });
  }

  if (el.btnPaginaProxima) {
    el.btnPaginaProxima.addEventListener("click", () => {
      paginaRelatorio++;
      buildTabela();
    });
  }

  if (el.btnExport) el.btnExport.addEventListener("click", exportCSV);
  if (el.btnSalvarProfessor) el.btnSalvarProfessor.addEventListener("click", salvarProfessor);

  if (el.btnCancelarEdicao) {
    el.btnCancelarEdicao.addEventListener("click", () => {
      cancelarEdicaoProfessor();
      el.msgProfessor.textContent = "";
    });
  }

  if (el.searchInput) {
    el.searchInput.addEventListener("input", renderListaProfessores);
  }

  if (el.tbodyProfessores) {
    el.tbodyProfessores.addEventListener("click", (event) => {
      const botao = event.target.closest("button[data-action]");
      if (!botao) return;

      const uid = botao.dataset.uid;
      const acao = botao.dataset.action;

      if (acao === "editar") iniciarEdicaoProfessor(uid);
      if (acao === "alternar") alternarAtivoProfessor(uid);
      if (acao === "excluir") excluirProfessor(uid, usuarios[uid]?.nome || uid);
    });
  }

  if (el.btnSalvarAviso) {
    el.btnSalvarAviso.addEventListener("click", salvarAviso);
  }

  if (el.tbodyAvisos) {
    el.tbodyAvisos.addEventListener("click", (event) => {
      const botao = event.target.closest("button[data-action]");
      if (!botao) return;
      if (botao.dataset.action === "excluir-aviso") {
        excluirAviso(botao.dataset.id);
      }
    });
  }

  // Definir data mínima de expiração como hoje
  if (el.avisoExpiracao) {
    el.avisoExpiracao.min = todayKey();
  }

  // Carregar avisos na inicialização
  carregarAvisos();

  // Eventos
  if (el.btnSalvarEvento) {
    el.btnSalvarEvento.addEventListener("click", salvarEvento);
  }

  if (el.tbodyEventos) {
    el.tbodyEventos.addEventListener("click", (event) => {
      const botao = event.target.closest("button[data-action]");
      if (!botao) return;
      if (botao.dataset.action === "excluir-evento") {
        excluirEvento(botao.dataset.id);
      }
    });
  }

  // Data mínima = hoje (não faz sentido cadastrar evento no passado)
  if (el.eventoData) {
    el.eventoData.min = todayKey();
  }

  // Carregar eventos na inicialização
  carregarEventos();

  // Sincronização da URL do Túnel com o Input e Firebase
  if (el.inputTunnelUrl && el.btnSalvarTunnelUrl) {
    firebase.database().ref("config/tunnel_url").on("value", (snap) => {
      const url = snap.val() || "";
      el.inputTunnelUrl.value = url;
    });

    el.btnSalvarTunnelUrl.addEventListener("click", async () => {
      const novaUrl = (el.inputTunnelUrl.value || "").trim();
      if (el.msgTunnelUrl) el.msgTunnelUrl.textContent = "";

      if (novaUrl && !novaUrl.startsWith("http://") && !novaUrl.startsWith("https://")) {
        if (el.msgTunnelUrl) {
          el.msgTunnelUrl.style.color = "var(--danger)";
          el.msgTunnelUrl.textContent = "A URL deve começar com http:// ou https://";
        }
        return;
      }

      el.btnSalvarTunnelUrl.disabled = true;
      const originalText = el.btnSalvarTunnelUrl.textContent;
      el.btnSalvarTunnelUrl.textContent = "Salvando...";

      try {
        await firebase.database().ref("config").update({ tunnel_url: novaUrl });
        if (el.msgTunnelUrl) {
          el.msgTunnelUrl.style.color = "var(--success)";
          el.msgTunnelUrl.textContent = "URL do túnel salva com sucesso!";
        }
        apiBaseUrl = novaUrl ? (novaUrl.endsWith("/") ? novaUrl : novaUrl + "/") : "";
        carregarUsuariosLocais();
        carregarPresencasPorData();
      } catch (error) {
        console.error("Erro ao salvar URL do túnel:", error);
        if (el.msgTunnelUrl) {
          el.msgTunnelUrl.style.color = "var(--danger)";
          el.msgTunnelUrl.textContent = "Erro ao salvar no Firebase.";
        }
      } finally {
        el.btnSalvarTunnelUrl.disabled = false;
        el.btnSalvarTunnelUrl.textContent = originalText;
        setTimeout(() => {
          if (el.msgTunnelUrl) el.msgTunnelUrl.textContent = "";
        }, 4000);
      }
    });
  }

  // Relógio
  setInterval(() => {
    if (el.lastUpdate) el.lastUpdate.textContent = nowBRTime();
  }, 1000);

  // Auto-refresh (a cada 10s para não sobrecarregar)
  setInterval(() => {
    carregarUsuariosLocais();
    carregarPresencasPorData();
    carregarAvisos();
    carregarEventos();
  }, 10000);
}

/* ========================================
   GUARDA DE AUTENTICAÇÃO
   gestao.js NUNCA inicializa sem usuário
   autenticado — quem tentar acessar
   gestao.html diretamente vai pro login.
======================================== */
firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
    window.location.replace("./login-gestao.html");
    return;
  }
  start();
});