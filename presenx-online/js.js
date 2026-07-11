// ── Relógio do Hero e TV ────────────────────────────
function atualizarRelogios() {
  const agora = new Date();
  
  // Relógio do Mockup do Hero
  const mockClockEl = document.getElementById("mockClock");
  if (mockClockEl) {
    mockClockEl.textContent = agora.toLocaleTimeString("pt-BR");
  }

  // Relógio da TV do Simulador
  const tvTimeEl = document.getElementById("tvTime");
  const tvDateEl = document.getElementById("tvDate");
  if (tvTimeEl && tvDateEl) {
    tvTimeEl.textContent = agora.toLocaleTimeString("pt-BR");
    tvDateEl.textContent = agora.toLocaleDateString("pt-BR");
  }
}
atualizarRelogios();
setInterval(atualizarRelogios, 1000);

// ── Base de Dados do Simulador ────────────────────────
const PROFESSORES = [
  { id: 1, uid: "A4 D3 F8 B2", name: "Carlos Eduardo", initials: "CE", classCode: "1TACV1", discipline: "Geografia", present: false, lastCheckIn: null },
  { id: 2, uid: "B8 2C 19 A5", name: "Mariana Costa", initials: "MC", classCode: "1TELEV1", discipline: "Matemática", present: false, lastCheckIn: null },
  { id: 3, uid: "F1 E0 9A 48", name: "Roberto Alves", initials: "RA", classCode: "1TIV1", discipline: "Sociologia", present: false, lastCheckIn: null },
  { id: 4, uid: "29 D4 B7 C1", name: "Ana Paula Silva", initials: "AP", classCode: "1TNDV1", discipline: "Saúde e Nutrição", present: false, lastCheckIn: null },
  { id: 5, uid: "C3 E2 F5 A0", name: "Fernanda Lima", initials: "FL", classCode: "2TACV1", discipline: "Inglês", present: false, lastCheckIn: null },
  { id: 6, uid: "6E D8 A9 1F", name: "Marcos Vinícius", initials: "MV", classCode: "2TIV1", discipline: "Banco de Dados", present: false, lastCheckIn: null },
  { id: 7, uid: "5F B2 C0 D8", name: "Júlia Mendes", initials: "JM", classCode: "2TNDV1", discipline: "Filosofia", present: false, lastCheckIn: null },
  { id: 8, uid: "D7 A1 3B E4", name: "Gabriel Santos", initials: "GS", classCode: "3TIV1", discipline: "Robótica", present: false, lastCheckIn: null }
];

let avisos = [
  { text: "Atenção: Reunião pedagógica hoje às 17:30 no Auditório A.", priority: "urgente" },
  { text: "Aviso: Diários de classe devem ser preenchidos até segunda-feira.", priority: "normal" }
];

// ── Síntese de Áudio para Bipes ─────────────────────
function playBeep(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    if (type === 'success') {
      // Duplo bipe agudo
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.setValueAtTime(1100, ctx.currentTime);
      gain1.gain.setValueAtTime(0.05, ctx.currentTime);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.08);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(1100, ctx.currentTime);
        gain2.gain.setValueAtTime(0.05, ctx.currentTime);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.08);
      }, 100);
    } else {
      // Bipe grave de erro
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.warn("Navegador bloqueou áudio ou sem suporte.");
  }
}

// ── Terminal Logger ─────────────────────────────────
function logTerminal(message, type = 'info') {
  const terminal = document.getElementById("terminalLog");
  if (!terminal) return;
  
  const line = document.createElement("div");
  line.className = `term-line ${type}`;
  
  const time = new Date().toLocaleTimeString("pt-BR");
  line.textContent = `[${time}] ${message}`;
  
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
  
  // Limita a 20 linhas
  while (terminal.children.length > 20) {
    terminal.removeChild(terminal.firstChild);
  }
}

// ── Renderizadores ──────────────────────────────────
function renderCrachas() {
  const grid = document.getElementById("crachasGrid");
  if (!grid) return;
  
  grid.innerHTML = PROFESSORES.map(p => `
    <button class="cracha-card ${p.present ? 'presente' : ''}" onclick="simularAproximacao(${p.id})">
      <div class="cracha-status"></div>
      <div class="cracha-avatar">${p.initials}</div>
      <span class="cracha-name">${p.name}</span>
      <span class="cracha-disc">${p.discipline}</span>
    </button>
  `).join("");
}

// Renderiza a grade de turmas na TV simulada
function renderTVGrade() {
  const grid = document.getElementById("tvTurmasGrid");
  if (!grid) return;
  
  grid.innerHTML = PROFESSORES.map(p => `
    <div class="tv-card ${p.present ? 'verde' : 'vermelho'}" id="tv-card-${p.id}">
      <div>
        <div class="tv-turma-code">${p.classCode}</div>
        <div class="tv-teacher-name">${p.present ? p.name : 'Ausente'}</div>
      </div>
      <div>
        <div class="tv-disc-label">Disciplina:</div>
        <div class="tv-disc-val">${p.discipline}</div>
      </div>
    </div>
  `).join("");
}

function renderTVAvisos() {
  const list = document.getElementById("tvAvisosList");
  if (!list) return;
  
  list.innerHTML = avisos.map(a => `
    <div class="tv-notice-item ${a.priority}">
      ${a.text}
    </div>
  `).join("");
}

// Atualiza os indicadores de Gestão
function atualizarKPIs() {
  const total = PROFESSORES.length;
  const presentes = PROFESSORES.filter(p => p.present).length;
  const ausentes = total - presentes;

  // Atualiza nos elementos administrativos
  const kpiTotal = document.getElementById("adminKpiTotal");
  const kpiPresent = document.getElementById("adminKpiPresent");
  const kpiAbsent = document.getElementById("adminKpiAbsent");

  if (kpiTotal) kpiTotal.textContent = total;
  if (kpiPresent) kpiPresent.textContent = presentes;
  if (kpiAbsent) kpiAbsent.textContent = ausentes;
}

// ── Funções de Simulação ────────────────────────────
function switchTab(tabId) {
  // Ocultar todas as abas
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));

  // Mostrar a aba selecionada
  document.getElementById(tabId).classList.add("active");
  document.getElementById(`btn-${tabId}`).classList.add("active");
}

function simularAproximacao(id) {
  const p = PROFESSORES.find(prof => prof.id === id);
  if (!p) return;

  // Animação de hardware no ESP32
  const led = document.getElementById("espLed");
  const reader = document.querySelector(".rfid-reader");
  
  if (led) led.className = "esp32-led active-green";
  if (reader) reader.classList.add("scanning");
  
  playBeep('success');

  // Logs no terminal
  logTerminal(`Crachá aproximado. UID: ${p.uid}`, 'system');
  
  setTimeout(() => {
    p.present = !p.present;
    p.lastCheckIn = p.present ? new Date().toLocaleTimeString("pt-BR") : null;
    
    // Terminal log
    logTerminal(`Conectando com a Nuvem Firebase...`, 'info');
    
    setTimeout(() => {
      logTerminal(`Firebase: ${p.name} marcado como ${p.present ? 'PRESENTE' : 'AUSENTE'}.`, 'success');
      
      // Atualizar interface
      renderCrachas();
      renderTVGrade();
      atualizarKPIs();

      // Aplicar pulso visual na TV
      const tvCard = document.getElementById(`tv-card-${p.id}`);
      if (tvCard) {
        tvCard.classList.add("tv-card-pulse");
        setTimeout(() => tvCard.classList.remove("tv-card-pulse"), 1000);
      }

      // Desliga LEDs do hardware
      if (led) led.className = "esp32-led";
      if (reader) reader.classList.remove("scanning");
    }, 400);

  }, 350);
}

// ── Simulador Administrativo (Firebase Auth) ──────────
function simularLogin() {
  const btn = document.getElementById("gestaoLoginBtn");
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = "Autenticando no Firebase...";
  
  logTerminal("Firebase Auth: Solicitando token de acesso...", "info");

  setTimeout(() => {
    document.getElementById("gestao-login-flow").style.display = "none";
    document.getElementById("gestao-admin-area").style.display = "flex";
    playBeep('success');
    logTerminal("Firebase Auth: Login realizado com sucesso! ID Token gerado.", "success");
    
    // Atualiza KPIs para refletir estado atual
    atualizarKPIs();
    
    // Restaurar botão
    btn.disabled = false;
    btn.textContent = "Entrar no Administrativo";
  }, 1000);
}

function simularLogout() {
  document.getElementById("gestao-admin-area").style.display = "none";
  document.getElementById("gestao-login-flow").style.display = "block";
  playBeep('success');
  logTerminal("Firebase Auth: Logout efetuado. Sessão encerrada.", "warn");
}

function publicarAviso() {
  const input = document.getElementById("avisoText");
  if (!input) return;

  const text = input.value.trim();
  if (!text) {
    playBeep('error');
    logTerminal("Erro: O texto do aviso não pode ser vazio.", "error");
    return;
  }

  const priority = document.querySelector('input[name="avisoPriority"]:checked').value;

  // Adiciona ao topo dos avisos
  avisos.unshift({ text, priority });
  
  // Limita a 3 avisos na tela da TV
  if (avisos.length > 3) {
    avisos.pop();
  }

  logTerminal(`Database: Novo aviso enviado para 'realtime/avisos'`, 'info');
  
  setTimeout(() => {
    logTerminal(`Aviso publicado com prioridade: ${priority.toUpperCase()}`, 'success');
    playBeep('success');
    renderTVAvisos();
    input.value = "";
  }, 300);
}

function exportarRelatorioCSV() {
  logTerminal("CSV Engine: Compilando banco de presenças local...", "info");
  
  playBeep('success');
  
  // Cabeçalho
  let csvContent = "\uFEFF"; // BOM para suporte a acentos no Excel
  csvContent += "Professor,Turma,Disciplina,Status,HorarioRegistro\n";
  
  // Linhas
  PROFESSORES.forEach(p => {
    const status = p.present ? "Presente" : "Ausente";
    const registro = p.lastCheckIn || "-";
    csvContent += `"${p.name}","${p.classCode}","${p.discipline}","${status}","${registro}"\n`;
  });

  // Criar download do arquivo
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.setAttribute("href", url);
  link.setAttribute("download", `relatorio_presenca_presenx.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  logTerminal("CSV Engine: Relatório baixado com sucesso.", "success");
}

// ── Mockup do Hero (Mantém o painel do Hero ativo) ────
const HERO_TURMAS = [
  { t: "1TACV1", d: "História" },
  { t: "1TELEV1", d: "Matemática" },
  { t: "1TIV1", d: "Sociologia" },
  { t: "1TNDV1", d: "Saúde" },
  { t: "2TACV1", d: "Inglês" },
  { t: "2TIV1", d: "Banco de Dados" },
  { t: "2TNDV1", d: "Filosofia" },
  { t: "3TIV1", d: "Robótica" }
];

const HERO_STATUS = ["verde", "verde", "verde", "vermelho", "vermelho", "cinza"];

function estadoAleatorio() {
  return HERO_STATUS[Math.floor(Math.random() * HERO_STATUS.length)];
}

const heroGrade = document.getElementById("mockGrade");
let heroEstados = HERO_TURMAS.map(() => estadoAleatorio());

function renderHeroMock() {
  if (!heroGrade) return;
  heroGrade.innerHTML = HERO_TURMAS.map((t, i) => `
    <div class="mockup-card ${heroEstados[i]}">
      <div class="mockup-turma">${t.t}</div>
      <div class="mockup-disc-label">Disciplina:</div>
      <div class="mockup-disc-val">${t.d}</div>
    </div>
  `).join("");
}

// Inicializações da Simulação
renderHeroMock();
renderCrachas();
renderTVGrade();
renderTVAvisos();

// Animação automática periódica do Mockup do Hero
if (heroGrade) {
  setInterval(() => {
    const i = Math.floor(Math.random() * HERO_TURMAS.length);
    heroEstados[i] = estadoAleatorio();
    const cards = heroGrade.querySelectorAll(".mockup-card");
    if (cards[i]) {
      cards[i].className = `mockup-card ${heroEstados[i]}`;
    }
  }, 2200);
}

// ── Contato & FAQ Logic ─────────────────────────────
function toggleFaq(btn) {
  const item = btn.parentElement;
  const answer = item.querySelector(".faq-answer");
  const isActive = item.classList.contains("active");

  // Fecha outros FAQs abertos para efeito de sanfona limpo
  document.querySelectorAll(".faq-item").forEach(i => {
    if (i !== item && i.classList.contains("active")) {
      i.classList.remove("active");
      i.querySelector(".faq-answer").style.maxHeight = "0px";
    }
  });

  if (isActive) {
    item.classList.remove("active");
    answer.style.maxHeight = "0px";
  } else {
    item.classList.add("active");
    answer.style.maxHeight = answer.scrollHeight + "px";
  }
}

function enviarContato() {
  const form = document.getElementById("contactForm");
  const name = document.getElementById("contact-name").value;
  const email = document.getElementById("contact-email").value;
  const subject = document.getElementById("contact-subject").value;
  const message = document.getElementById("contact-message").value;

  if (!name || !email || !subject || !message) return;

  playBeep('success');
  logTerminal(`Suporte: Mensagem de ${name} (${subject}) enviada.`, 'success');

  // Envia os dados via POST para o Netlify Forms (AJAX)
  const formData = new FormData(form);
  fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(formData).toString()
  })
  .then(() => {
    logTerminal("Netlify: Formulário recebido e armazenado na nuvem.", "success");
  })
  .catch((error) => {
    logTerminal("Netlify: Falha de rede ao sincronizar formulário.", "error");
    console.error(error);
  });

  // Mostra aviso de sucesso na interface
  document.getElementById("contactForm").style.display = "none";
  document.getElementById("contactSuccess").style.display = "flex";
}

// ── Reveal on scroll ───────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
