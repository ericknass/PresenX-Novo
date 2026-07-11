const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dns = require("dns");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

const app = express();
const PORT = 3000;

// =========================
// Firebase Admin
// =========================
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://controledepresenca-99c9d-default-rtdb.firebaseio.com/"
});

const firebaseDb = admin.database();

// =========================
// Banco local SQLite
// =========================
const db = new sqlite3.Database("./presenx.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS cursos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      sincronizado INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      uid TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      curso TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      sincronizado INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS presencas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      uid TEXT NOT NULL,
      nome TEXT NOT NULL,
      curso TEXT NOT NULL,
      status TEXT NOT NULL,
      hora_entrada TEXT,
      hora_saida TEXT,
      sincronizado INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS avisos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      curso TEXT NOT NULL,
      data TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      sincronizado INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ultimo_acesso (
      chave TEXT PRIMARY KEY,
      uid TEXT,
      nome TEXT,
      curso TEXT,
      hora TEXT,
      data TEXT,
      status TEXT,
      sincronizado INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO cursos (id, nome, sincronizado)
    VALUES
      ('informatica', 'Informática', 0),
      ('administracao', 'Administração', 0),
      ('todos', 'Todos', 0)
  `);
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../web")));

// =========================
// Helpers
// =========================
function ok(res, data = {}) {
  return res.json({ ok: true, ...data });
}

function fail(res, code, erro) {
  return res.status(code).json({ ok: false, erro });
}

function temInternet() {
  return new Promise((resolve) => {
    dns.lookup("google.com", (err) => resolve(!err));
  });
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function salvarUltimoAcesso({ uid, nome, curso, hora, data, status }) {
  await runAsync(
    `INSERT INTO ultimo_acesso (chave, uid, nome, curso, hora, data, status, sincronizado)
     VALUES ('ultimo', ?, ?, ?, ?, ?, ?, 0)
     ON CONFLICT(chave) DO UPDATE SET
       uid = excluded.uid,
       nome = excluded.nome,
       curso = excluded.curso,
       hora = excluded.hora,
       data = excluded.data,
       status = excluded.status,
       sincronizado = 0`,
    [uid, nome, curso, hora, data, status]
  );
}

// =========================
// TESTE
// =========================
app.get("/api/ping", (req, res) => {
  ok(res, { msg: "Servidor híbrido PresenX rodando" });
});

// =========================
// CURSOS
// =========================
app.get("/api/cursos", async (req, res) => {
  try {
    const rows = await allAsync("SELECT * FROM cursos ORDER BY nome ASC");
    ok(res, { cursos: rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post("/api/cursos", async (req, res) => {
  try {
    const id = String(req.body.id || "").trim().toLowerCase();
    const nome = String(req.body.nome || "").trim();

    if (!id || !nome) {
      return fail(res, 400, "id e nome são obrigatórios");
    }

    await runAsync(
      `INSERT INTO cursos (id, nome, sincronizado)
       VALUES (?, ?, 0)
       ON CONFLICT(id) DO UPDATE SET
         nome = excluded.nome,
         sincronizado = 0`,
      [id, nome]
    );

    ok(res);
  } catch (err) {
    fail(res, 500, err.message);
  }
});

// =========================
// USUÁRIOS
// =========================
app.get("/api/usuarios", async (req, res) => {
  try {
    const rows = await allAsync("SELECT * FROM usuarios ORDER BY nome ASC");
    ok(res, { usuarios: rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get("/api/usuarios/:uid", async (req, res) => {
  try {
    const uid = String(req.params.uid || "").trim().toUpperCase();
    const row = await getAsync("SELECT * FROM usuarios WHERE uid = ?", [uid]);

    if (!row) return fail(res, 404, "Usuário não encontrado");
    ok(res, { usuario: row });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post("/api/usuarios", async (req, res) => {
  try {
    const uid = String(req.body.uid || "").trim().toUpperCase();
    const nome = String(req.body.nome || "").trim();
    const curso = String(req.body.curso || "").trim().toLowerCase();
    const ativo = req.body.ativo ? 1 : 0;

    if (!uid || !nome || !curso) {
      return fail(res, 400, "uid, nome e curso são obrigatórios");
    }

    await runAsync(
      `INSERT INTO usuarios (uid, nome, curso, ativo, sincronizado)
       VALUES (?, ?, ?, ?, 0)
       ON CONFLICT(uid) DO UPDATE SET
         nome = excluded.nome,
         curso = excluded.curso,
         ativo = excluded.ativo,
         sincronizado = 0`,
      [uid, nome, curso, ativo]
    );

    ok(res);
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.delete("/api/usuarios/:uid", async (req, res) => {
  try {
    const uid = String(req.params.uid || "").trim().toUpperCase();
    const result = await runAsync("DELETE FROM usuarios WHERE uid = ?", [uid]);
    ok(res, { removidos: result.changes });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

// =========================
// AVISOS
// =========================
app.get("/api/avisos", async (req, res) => {
  try {
    const rows = await allAsync("SELECT * FROM avisos ORDER BY data DESC, id DESC");
    ok(res, { avisos: rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post("/api/avisos", async (req, res) => {
  try {
    const titulo = String(req.body.titulo || "").trim();
    const mensagem = String(req.body.mensagem || "").trim();
    const curso = String(req.body.curso || "").trim().toLowerCase();
    const data = String(req.body.data || "").trim();
    const ativo = req.body.ativo ? 1 : 0;

    if (!titulo || !mensagem || !curso || !data) {
      return fail(res, 400, "titulo, mensagem, curso e data são obrigatórios");
    }

    const result = await runAsync(
      `INSERT INTO avisos (titulo, mensagem, curso, data, ativo, sincronizado)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [titulo, mensagem, curso, data, ativo]
    );

    ok(res, { id: result.lastID });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.put("/api/avisos/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const titulo = String(req.body.titulo || "").trim();
    const mensagem = String(req.body.mensagem || "").trim();
    const curso = String(req.body.curso || "").trim().toLowerCase();
    const data = String(req.body.data || "").trim();
    const ativo = req.body.ativo ? 1 : 0;

    if (!titulo || !mensagem || !curso || !data) {
      return fail(res, 400, "titulo, mensagem, curso e data são obrigatórios");
    }

    const result = await runAsync(
      `UPDATE avisos
       SET titulo = ?, mensagem = ?, curso = ?, data = ?, ativo = ?, sincronizado = 0
       WHERE id = ?`,
      [titulo, mensagem, curso, data, ativo, id]
    );

    ok(res, { alterados: result.changes });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.delete("/api/avisos/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await runAsync("DELETE FROM avisos WHERE id = ?", [id]);
    ok(res, { removidos: result.changes });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

// =========================
// ÚLTIMO ACESSO
// =========================
app.get("/api/ultimo-acesso", async (req, res) => {
  try {
    const row = await getAsync("SELECT * FROM ultimo_acesso WHERE chave = 'ultimo'");
    ok(res, { ultimoAcesso: row || null });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

// =========================
// PRESENÇAS
// =========================
app.get("/api/presencas", async (req, res) => {
  try {
    const data = String(req.query.data || "").trim();
    if (!data) return fail(res, 400, "data é obrigatória");

    const rows = await allAsync(
      "SELECT * FROM presencas WHERE data = ? ORDER BY nome ASC",
      [data]
    );

    ok(res, { presencas: rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post("/api/presenca", async (req, res) => {
  try {
    const data = String(req.body.data || "").trim();
    const uid = String(req.body.uid || "").trim().toUpperCase();
    const hora = String(req.body.hora || "").trim();

    if (!data || !uid || !hora) {
      return fail(res, 400, "data, uid e hora são obrigatórios");
    }

    const usuario = await getAsync("SELECT * FROM usuarios WHERE uid = ?", [uid]);

    if (!usuario) return fail(res, 404, "Usuario nao cadastrado");
    if (usuario.ativo !== 1) return fail(res, 403, "Usuario inativo");

    const presenca = await getAsync(
      "SELECT * FROM presencas WHERE data = ? AND uid = ?",
      [data, uid]
    );

    if (!presenca) {
      await runAsync(
        `INSERT INTO presencas (data, uid, nome, curso, status, hora_entrada, hora_saida, sincronizado)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [data, uid, usuario.nome, usuario.curso, "Presente", hora, ""]
      );

      await salvarUltimoAcesso({
        uid,
        nome: usuario.nome,
        curso: usuario.curso,
        hora,
        data,
        status: "Presente"
      });

      return ok(res, {
        acao: "entrada",
        nome: usuario.nome,
        curso: usuario.curso
      });
    }

    const novoStatus = presenca.status === "Presente" ? "Ausente" : "Presente";
    const novaEntrada = novoStatus === "Presente" ? hora : presenca.hora_entrada;
    const novaSaida = novoStatus === "Ausente" ? hora : "";

    await runAsync(
      `UPDATE presencas
       SET status = ?, hora_entrada = ?, hora_saida = ?, nome = ?, curso = ?, sincronizado = 0
       WHERE data = ? AND uid = ?`,
      [novoStatus, novaEntrada, novaSaida, usuario.nome, usuario.curso, data, uid]
    );

    await salvarUltimoAcesso({
      uid,
      nome: usuario.nome,
      curso: usuario.curso,
      hora,
      data,
      status: novoStatus
    });

    ok(res, {
      acao: novoStatus === "Presente" ? "entrada" : "saida",
      nome: usuario.nome,
      curso: usuario.curso
    });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post("/api/reset-presencas", async (req, res) => {
  try {
    const data = String(req.body.data || "").trim();
    const hora = String(req.body.hora || "").trim();

    if (!data || !hora) {
      return fail(res, 400, "data e hora são obrigatórias");
    }

    const result = await runAsync(
      `UPDATE presencas
       SET status = 'Ausente',
           hora_saida = CASE
             WHEN hora_saida IS NULL OR hora_saida = '' THEN ?
             ELSE hora_saida
           END,
           sincronizado = 0
       WHERE data = ? AND status = 'Presente'`,
      [hora, data]
    );

    ok(res, { resetados: result.changes });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get("/api/hora", (req, res) => {
  const agora = new Date();

  const y = agora.getFullYear();
  const m = String(agora.getMonth() + 1).padStart(2, "0");
  const d = String(agora.getDate()).padStart(2, "0");

  const hh = String(agora.getHours()).padStart(2, "0");
  const mm = String(agora.getMinutes()).padStart(2, "0");
  const ss = String(agora.getSeconds()).padStart(2, "0");

  res.json({
    ok: true,
    data: `${y}-${m}-${d}`,
    hora: `${hh}:${mm}:${ss}`,
    horaNum: Number(hh),
    minNum: Number(mm)
  });
});

// =========================
// SINCRONIZAÇÃO COM FIREBASE
// =========================
async function syncCursos() {
  const rows = await allAsync("SELECT * FROM cursos WHERE sincronizado = 0");
  for (const curso of rows) {
    await firebaseDb.ref(`cursos/${curso.id}`).set({
      nome: curso.nome
    });
    await runAsync("UPDATE cursos SET sincronizado = 1 WHERE id = ?", [curso.id]);
  }
  if (rows.length) console.log("Cursos sincronizados:", rows.length);
}

async function syncUsuarios() {
  const rows = await allAsync("SELECT * FROM usuarios WHERE sincronizado = 0");
  for (const usuario of rows) {
    await firebaseDb.ref(`usuarios/${usuario.uid}`).set({
      nome: usuario.nome,
      curso: usuario.curso,
      ativo: usuario.ativo === 1
    });
    await runAsync("UPDATE usuarios SET sincronizado = 1 WHERE uid = ?", [usuario.uid]);
  }
  if (rows.length) console.log("Usuarios sincronizados:", rows.length);
}

async function syncAvisos() {
  const rows = await allAsync("SELECT * FROM avisos WHERE sincronizado = 0");
  for (const aviso of rows) {
    await firebaseDb.ref(`avisos/${aviso.id}`).set({
      titulo: aviso.titulo,
      mensagem: aviso.mensagem,
      curso: aviso.curso,
      data: aviso.data,
      ativo: aviso.ativo === 1
    });
    await runAsync("UPDATE avisos SET sincronizado = 1 WHERE id = ?", [aviso.id]);
  }
  if (rows.length) console.log("Avisos sincronizados:", rows.length);
}

async function syncPresencas() {
  const rows = await allAsync("SELECT * FROM presencas WHERE sincronizado = 0");
  for (const p of rows) {
    await firebaseDb.ref(`presencas/${p.data}/${p.uid}`).set({
      nome: p.nome,
      curso: p.curso,
      status: p.status,
      hora_entrada: p.hora_entrada || "",
      hora_saida: p.hora_saida || ""
    });
    await runAsync("UPDATE presencas SET sincronizado = 1 WHERE id = ?", [p.id]);
  }
  if (rows.length) console.log("Presencas sincronizadas:", rows.length);
}

async function syncUltimoAcesso() {
  const row = await getAsync("SELECT * FROM ultimo_acesso WHERE chave = 'ultimo' AND sincronizado = 0");
  if (!row) return;

  await firebaseDb.ref("ultimo_acesso").set({
    uid: row.uid || "",
    nome: row.nome || "",
    curso: row.curso || "",
    hora: row.hora || "",
    data: row.data || "",
    status: row.status || ""
  });

  await runAsync("UPDATE ultimo_acesso SET sincronizado = 1 WHERE chave = 'ultimo'");
  console.log("Ultimo acesso sincronizado");
}

async function sincronizarComFirebase() {
  try {
    const online = await temInternet();
    if (!online) {
      console.log("Sem internet. Sincronizacao pausada.");
      return;
    }

    await syncCursos();
    await syncUsuarios();
    await syncAvisos();
    await syncPresencas();
    await syncUltimoAcesso();

    console.log("Sincronizacao concluida.");
  } catch (error) {
    console.error("Erro na sincronizacao:", error.message);
  }
}

setInterval(() => {
  sincronizarComFirebase();
}, 10000);

app.get("/api/importar-cursos-firebase", async (req, res) => {
  try {
    const snap = await firebaseDb.ref("cursos").once("value");
    const cursosFirebase = snap.val() || {};

    let total = 0;

    for (const [id, curso] of Object.entries(cursosFirebase)) {
      const nome = String(curso?.nome || id).trim();

      await runAsync(
        `INSERT INTO cursos (id, nome, sincronizado)
         VALUES (?, ?, 1)
         ON CONFLICT(id) DO UPDATE SET
           nome = excluded.nome,
           sincronizado = 1`,
        [id, nome]
      );

      total++;
    }

    res.send(`Cursos importados com sucesso: ${total}`);
  } catch (error) {
    console.error("Erro ao importar cursos do Firebase:", error);
    res.status(500).send(error.message);
  }
});

app.get("/api/importar-usuarios-firebase", async (req, res) => {
  try {
    const snap = await firebaseDb.ref("usuarios").once("value");
    const usuariosFirebase = snap.val() || {};

    let total = 0;

    for (const [uid, usuario] of Object.entries(usuariosFirebase)) {
      const nome = String(usuario?.nome || "Sem nome").trim();
      const curso = String(usuario?.curso || "").trim().toLowerCase();
      const ativo = usuario?.ativo ? 1 : 0;

      await runAsync(
        `INSERT INTO usuarios (uid, nome, curso, ativo, sincronizado)
         VALUES (?, ?, ?, ?, 1)
         ON CONFLICT(uid) DO UPDATE SET
           nome = excluded.nome,
           curso = excluded.curso,
           ativo = excluded.ativo,
           sincronizado = 1`,
        [uid, nome, curso, ativo]
      );

      total++;
    }

    res.send(`Usuarios importados com sucesso: ${total}`);
  } catch (error) {
    console.error("Erro ao importar usuarios do Firebase:", error);
    res.status(500).send(error.message);
  }
});

// =========================
// SUBIR SERVIDOR
// =========================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
  sincronizarComFirebase();
});