# 🌿 Documentação Técnica e Guia de Validação — Flora Acessórios 4.0 (PI4)

Este documento foi elaborado para alinhamento e validação da equipe do **Projeto Integrador IV (PI4)** e para orientar os membros de testes na execução local e homologação na nuvem (**Render**).

---

## 📌 1. Visão Geral e Arquitetura do Sistema

O projeto **Flora Acessórios 4.0** é uma plataforma integrada de gestão de vendas, controle de inventário e previsão de demanda de acessórios (anéis, brincos, colares, pulseiras e braceletes).

### 🏗️ Arquitetura Monorepo Unificada

```text
flora-acessorios-pi4/
├── database/                   # Modelagem relacional e carga de dados
│   ├── schema.sql              # Script DDL completo de tabelas (MySQL / Nuvem)
│   └── seed.sql                # Dados iniciais realistas (catálogo, equipe, vendas)
├── back-end/                   # API REST em Node.js + Express
│   ├── src/
│   │   ├── config/database.js  # Motor de banco híbrido (MySQL local + Fallback Render)
│   │   ├── controllers/        # Controladores (auth, produtos, pedidos, demanda)
│   │   ├── middlewares/        # Middlewares (autenticação JWT)
│   │   ├── routes/             # Definição de rotas (/api/v1/...)
│   │   └── server.js           # Servidor Express com suporte a build estático
│   ├── .env                    # Configuração local (XAMPP root sem senha)
│   └── package.json            # Dependências e scripts do servidor
├── front-end/                  # Aplicação web React 18 + Vite + Tailwind CSS
│   ├── components/             # Componentes modulares Shadcn / Radix UI / Gráficos
│   ├── pages/                  # Telas completas (Dashboard, Pedidos, Catálogo, Login, etc.)
│   ├── services/api.js         # Camada de comunicação HTTP REST com a API
│   ├── vite.config.js          # Configuração de host 127.0.0.1 e proxy reverso /api
│   └── package.json            # Dependências do front-end
├── pesos_modelo/               # Pesos pré-treinados do modelo de Rede Neural MLP (PyTorch)
├── Rede_Neural_MLP.ipynb       # Notebook de treinamento e inferência de previsão de demanda
├── Tutorial para ligar o...txt # Especificação oficial dos passos de execução
├── criar-banco.bat             # Script de criação automatizada do banco no XAMPP
├── iniciar.bat                 # Script de inicialização em 2 janelas (Back e Front)
├── render.yaml                 # Configuração de Infraestrutura como Código (IaC) para o Render
└── package.json                # Monorepo root com comandos unificados de build e start
```

---

## 💾 2. Banco de Dados (`database/`)

O banco de dados oficial foi configurado sob o nome **`flora_acessorios`**, compatível tanto com o MySQL do XAMPP quanto com bancos gerenciados na nuvem.

### 📋 Tabelas Modeladas

| Tabela | Chave Primária | Finalidade |
| :--- | :--- | :--- |
| **`usuarios`** | `id` (Auto Increment) | Autenticação, hash bcrypt da senha, status de verificação (`is_verified`) e tokens. |
| **`funcionario`** | `id_func` (Auto Increment) | Cadastro de colaboradores e vendedores da loja (CPF, admissão, nome). |
| **`categorias`** | `id` (Auto Increment) | Categorias de acessórios (Anéis, Brincos, Colares, Pulseiras, Braceletes). |
| **`produto`** | `id_prod` (SKU textual) | Catálogo com código SKU (ex: `ANE-001`), descrição, categoria, valor e estoques. |
| **`venda_cab`** | `id_venda` (Auto Increment) | Cabeçalho das vendas (vendedor, data da venda e valor total). |
| **`venda_item`** | `id_item` (Auto Increment) | Itens da venda vinculando o produto vendido, quantidade e valor unitário. |
| **`demand_records`**| `id` (Auto Increment) | Histórico de saídas diárias por SKU para alimentar o modelo preditivo. |
| **`messages`** | `id` (Auto Increment) | Mural interno de mensagens e comunicados da equipe. |
| **`favourites`** | `id` (Auto Increment) | Acessórios marcados como favoritos por usuário. |

---

## ⚙️ 3. Back-End e Motor Híbrido Resiliente

### 🔌 Conexão Híbrida Inteligente (Dual-Engine)
Para resolver o desafio de funcionar perfeitamente tanto no **XAMPP local** quanto no **Render (onde não há XAMPP nem MySQL local instalado)**:
1. **Ambiente Local (XAMPP):** O módulo `src/config/database.js` conecta-se diretamente ao MySQL em `127.0.0.1:3306` com usuário `root` e banco `flora_acessorios`.
2. **Ambiente em Nuvem (Render) ou Fallback:** Caso o MySQL não esteja em execução, o back-end ativa automaticamente o **modo de persistência integrado e resiliente**, garantindo que a aplicação nunca caia por erro de banco e mantenha todas as funcionalidades (cadastro, login, pedidos e previsões) 100% operacionais.

### 🔐 Ciclo de Vida da Autenticação
Implementado estritamente de acordo com as regras do projeto:
- **Cadastro (`POST /api/v1/auth/register`):**
  - Exige senha forte com no mínimo 8 caracteres, contendo pelo menos uma letra e um número.
  - Gera token seguro e grava o usuário com `is_verified = 0`.
  - Imprime no terminal do back-end a mensagem exigida no tutorial:  
    `Confirme seu e-mail: http://127.0.0.1:3000/api/v1/auth/verify-email?token=<token>`
  - Para facilitar o trabalho da pessoa de testes no Render, a API também retorna a URL de verificação, exibindo um botão de **Ativação Rápida** na tela.
- **Confirmação (`GET /api/v1/auth/verify-email?token=...`):**
  - Valida o token e atualiza `is_verified = 1`.
  - Renderiza página HTML confirmando: *"E-mail confirmado. Você já pode voltar ao site e fazer login."*
- **Login (`POST /api/v1/auth/login`):**
  - Se a conta ainda não foi confirmada pelo link, o login é bloqueado com status HTTP 403 e a mensagem de erro orientativa.
- **Esqueceu a Senha (`POST /api/v1/auth/forgot-password`):**
  - Conforme solicitado no tutorial, se o e-mail informado for de uma conta ainda não confirmada, um **novo link de confirmação** é gerado e exibido na janela do back-end.

---

## 🎨 4. Front-End Integrado (`front-end/`)

O front-end em React 18 + Vite foi desacoplado de dependências diretas de nuvens proprietárias e passou a consumir os endpoints REST padronizados:
1. **Proxy Reverso no Vite (`vite.config.js`):** Redireciona chamadas `/api` para a porta 3000 em ambiente de desenvolvimento local, eliminando qualquer bloqueio de CORS.
2. **Módulo de Pedidos (`Orders.jsx`):** Registra vendas com vendedor, SKU do produto, mês, ano e valor, atualizando o estoque e gerando o registro em `demand_records`.
3. **Módulo de Produtos (`Products.jsx`):** Listagem completa com filtros por categoria, ajuste rápido de estoque (+ / -), exclusão e importação em lote via CSV.
4. **Relatórios e Ranking (`Leaderboard.jsx` e `SalesReport.jsx`):** Pódio dos melhores vendedores e gráficos de faturamento mensal.
5. **Previsão de Demanda (`DemandForecastSection.jsx`):** Indicadores analíticos projetando a necessidade de reposição de estoque com base no histórico de vendas e no modelo preditivo.

---

## 🚀 5. Como Executar Localmente (Passo a Passo)

### Pré-requisitos:
- **Node.js** 20.19 ou superior.
- **XAMPP** com MySQL instalado.

### Execução:
1. Abra o **XAMPP Control Panel** e clique em **Start** no MySQL (deve ficar verde).
2. Dê dois cliques em **`criar-banco.bat`**:
   - O script criará o banco `flora_acessorios` e carregará as tabelas e dados iniciais.
   - Aguarde a mensagem **"Banco pronto"** e pressione qualquer tecla.
3. Dê dois cliques em **`iniciar.bat`**:
   - Na primeira vez, as dependências serão instaladas automaticamente.
   - Duas janelas serão abertas:
     - **Flora - Back-end:** exibindo `Flora API em http://127.0.0.1:3000/api/v1`.
     - **Flora - Front-end:** exibindo o endereço `http://127.0.0.1:5173`.
4. Abra `http://127.0.0.1:5173` no navegador:
   - Clique em **Cadastre-se**, preencha nome, e-mail e senha.
   - Vá até a janela **Flora - Back-end**, copie o link `http://127.0.0.1:3000/api/v1/auth/verify-email?token=...`, abra em uma nova aba do navegador.
   - Após ver **"E-mail confirmado"**, retorne à tela de login e entre no sistema.

---

## ☁️ 6. Como Subir para a Vercel (Opção Principal para Homologação)

O projeto conta com o arquivo [`vercel.json`](file:///c:/CODEBASE/vercel.json) e o entrypoint serverless [`api/index.js`](file:///c:/CODEBASE/api/index.js), permitindo que **Front-end e Back-end rodem juntos na Vercel sob uma única URL gratuita**:

### Passo a Passo na Vercel:
1. Envie as alterações para o seu repositório no GitHub:
   ```bash
   git add .
   git commit -m "feat(pi4): estrutura completa monorepo com suporte a deploy na Vercel"
   git push origin main
   ```
2. Acesse o painel da [Vercel](https://vercel.com/) e clique em **Add New...** > **Project**.
3. Importe o repositório **`FelipeGardenghiDev/flora-acessorios-pi4`**.
4. A Vercel detectará automaticamente as configurações do `vercel.json`:
   - **Framework Preset:** `Vite` (ou Other)
   - **Build Command:** `npm run build`
   - **Output Directory:** `front-end/dist`
5. Clique em **Deploy**.
6. A Vercel gerará o link oficial do projeto (ex.: `https://flora-acessorios.vercel.app`).
7. **Homologação:**
   - A pessoa de testes acessa o link da Vercel.
   - O Front-end React carrega instantaneamente via CDN global.
   - As chamadas `/api/v1/...` são atendidas pelas Serverless Functions embutidas no mesmo domínio.
   - O fluxo de cadastro com o botão verde de ativação rápida permite homologar 100% sem necessidade de terminal.

---

## ⚡ 7. Alternativa: Deploy no Render

Caso a equipe opte por subir no **Render**, o projeto também está 100% pronto com [`render.yaml`](file:///c:/CODEBASE/render.yaml):
- **Tipo de Serviço:** Web Service (Node.js)
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- O servidor Express compila o front-end e serve tanto a API quanto as telas na porta definida pelo Render.
