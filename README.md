# PresenX

PresenX é um sistema digital escolar de controle de presença em tempo real, desenvolvido para escolas públicas com foco em simplicidade, baixo custo e impacto social.

## O que é

O projeto utiliza ESP32, RFID e Firebase para automatizar o registro de presença, oferecendo:

- leitura rápida por crachá RFID
- painel em tempo real para visualização
- gestão escolar com acesso controlado
- solução escalável e de baixo custo

## Tecnologias

- ESP32
- RFID / RC522
- Firebase
- HTML, CSS e JavaScript
- Node.js para o backend do servidor

## Estrutura do projeto

- `presenx-online/` — landing page e interface web
- `server/` — backend e integração com serviços
- `presenx_esp/` — firmware para ESP32
- `data/` — arquivos locais de dados da aplicação (ignorados no Git)

## Como começar

1. Clone o repositório
2. Abra a pasta `presenx-online/` para visualizar a landing page
3. Para o backend, entre em `server/` e instale as dependências
4. Para o hardware, use o firmware em `presenx_esp/`

## Objetivo

Democratizar o acesso a soluções tecnológicas para educação pública, permitindo que mais escolas possam adotar sistemas modernos de controle de presença com custo acessível.

## Licença

Este projeto é voltado para uso educacional e colaborativo.
