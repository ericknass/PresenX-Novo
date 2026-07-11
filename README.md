# 🎓 PresenX

> Plataforma Digital de Comunicação Institucional Escolar

O **PresenX** é uma plataforma desenvolvida para modernizar a comunicação no ambiente escolar, centralizando informações importantes em um painel digital acessível por alunos, professores e gestão.

O sistema surgiu a partir da necessidade de reduzir deslocamentos desnecessários de alunos até a coordenação apenas para verificar a disponibilidade de professores, evoluindo posteriormente para uma plataforma completa de comunicação institucional.

---

## 🚀 Funcionalidades

- 📢 Painel digital institucional
- 👨‍🏫 Controle de presença de professores via RFID
- 📅 Eventos escolares
- 📢 Avisos da gestão
- 📊 Dashboard administrativo
- 👥 Gerenciamento de professores
- 📈 Relatórios
- 🌐 Funcionamento Online
- 💻 Funcionamento Offline
- 🔄 Sincronização automática entre servidor local e nuvem

---

## 🖥️ Tecnologias Utilizadas

### Front-end

- HTML5
- CSS3
- JavaScript

### Back-end

- Node.js
- Express

### Banco de Dados

- SQLite (Servidor Local)
- Firebase Realtime Database (Sincronização)

### Hardware

- ESP32
- RFID RC522
- Cartões RFID
- LCD I2C

---

## 🏗️ Arquitetura

```text
Professor
     │
Cartão RFID
     │
ESP32
     │
Notebook Servidor
     │
SQLite
     │
Firebase
     │
Painel Digital
```

---

## 📸 Demonstração

### Painel

<img width="1920" height="1080" alt="PresenX _ Painel - Opera 03_07_2026 13_34_02" src="https://github.com/user-attachments/assets/0a8b3587-943b-49f8-8b35-25af214636c1" />

### Gestão

<img width="1920" height="1080" alt="PresenX _ Administrativo - Opera 08_07_2026 22_31_22" src="https://github.com/user-attachments/assets/8ecb933f-7905-4e1c-a275-20422ddc44f3" />

---

## 📂 Estrutura do Projeto

```text
📁 css/
📁 js/
📁 assets/
📁 server/
📁 firebase/

index.html
painel.html
gestao.html
dashboard.html
```

---

## ⚙️ Como Executar

### Clone o projeto

```bash
git clone https://github.com/ericknass/PresenX-Novo.git
```

### Instale as dependências

```bash
npm install
```

### Execute o servidor

```bash
npm start
```

---

## 🌐 Funcionamento

O sistema possui dois modos de operação:

### Offline

- Servidor local
- SQLite
- ESP32
- Painel Local

### Online

- Firebase Hosting
- Ngrok
- Sincronização automática

---

## 🎯 Objetivo

O PresenX busca melhorar a comunicação institucional nas escolas através de um painel digital inteligente, permitindo que informações importantes sejam disponibilizadas em tempo real para toda a comunidade escolar.

---

## 👨‍💻 Equipe

**Erick Nascimento Souza**

Desenvolvimento Web • Arquitetura • Banco de Dados • Integração

**Antoni Silva de Melo Santos**

Hardware • Prototipagem • Testes

---

## 📜 Licença

Projeto desenvolvido para fins educacionais.
