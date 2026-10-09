# 🌸 Flora Acessórios 4.0 — Sistema de Gestão & Previsão de Demanda com Inteligência Artificial

> **Projeto Integrador (PI 4) — Engenharia da Computação / Ciência de Dados**  
> Solução Full-Stack completa para controle de vendas (PDV), gestão de inventário inteligente, métricas financeiras e **Previsão de Demanda com Redes Neurais Artificiais (MLP)**.

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-blue?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?logo=nodedotjs)](https://nodejs.org/)
[![PyTorch](https://img.shields.io/badge/Machine%20Learning-PyTorch%20MLP-ee4c2c?logo=pytorch)](https://pytorch.org/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%20%2F%20XAMPP-orange?logo=mysql)](https://www.mysql.com/)

---

## 📌 Sumário

1. [Visão Geral](#-visão-geral)
2. [Arquitetura e Tecnologias](#-arquitetura-e-tecnologias)
3. [Módulo de Machine Learning (Rede Neural MLP)](#-módulo-de-machine-learning-rede-neural-mlp)
4. [Estrutura do Repositório](#-estrutura-do-repositório)
5. [Como Rodar Localmente (Windows + XAMPP)](#-como-rodar-localmente-windows--xampp)
6. [Deploy em Nuvem (Vercel)](#-deploy-em-nuvem-vercel)
7. [Credenciais de Teste](#-credenciais-de-teste)
8. [Telas e Funcionalidades](#-telas-e-funcionalidades)

---

## 🌟 Visão Geral

O **Flora Acessórios 4.0** moderniza a gestão de uma loja de semijoias e acessórios finos através de:
- **Gestão Operacional:** Cadastro de produtos por SKU, controle de estoque mínimo e reposição, categorização dinâmica e relatórios analíticos de vendas.
- **Ponto de Venda (PDV):** Lançamento ágil de vendas por vendedor com cálculo automático e histórico em tempo real.
- **Inteligência Artificial Preditiva:** Algoritmo de projeção temporal e Rede Neural Multilayer Perceptron treinada com histórico de transações para antecipar a demanda dos próximos 7 a 30 dias, evitando rupturas de estoque e capital parado.

---

## 🛠️ Arquitetura e Tecnologias

### 🎨 Front-End
- **React 18** com **Vite** (bundler de alta performance).
- **Tailwind CSS** + **Shadcn UI** (Radix UI) para componentes acessíveis e elegantes com suporte a Dark Mode.
- **Recharts** para gráficos interativos de faturamento, curvas de tendência e demanda futura.
- **@dnd-kit** para reorganização dinâmica dos cartões do Dashboard por *drag-and-drop*.
- **Lucide React** para iconografia semântica.
- **Sonner / Toast** para feedback visual imediato.

### ⚙️ Back-End
- **Node.js** com **Express**.
- **RESTful API** com rotas completas para autenticação, catálogo, inventário, vendas e análises.
- **Segurança:** Hashing de senhas com `bcrypt` e tokens assinados `JWT` (JSON Web Token).
- **Driver Híbrido:** Conexão nativa com **MySQL (via mysql2/promise)** no ambiente local/servidor e camada de **Fallback Resiliente em memória/localStorage** para execução Serverless em nuvem (Vercel).

### 🗄️ Banco de Dados
- **MySQL 8.0+ / MariaDB (XAMPP)**.
- Schema normalizado (`database/schema.sql`): tabelas `usuarios`, `funcionario`, `categorias`, `produto`, `venda_cab`, `venda_item`, `demand_records`, `messages`, `favourites`.
- Carga de dados inicial (`database/seed.sql`) com histórico de vendas e demanda.

---

## 🧠 Módulo de Machine Learning (Rede Neural MLP)

O projeto conta com uma abordagem completa de Ciência de Dados para modelagem preditiva de demanda:

### 1. Notebook Experimental (`Rede_Neural_Multilayer_Perceptron_MLP_(Teste).ipynb`)
- **Objetivo:** Previsão multi-step da demanda diária de produtos para os próximos **7 dias no futuro ($t+1$ a $t+7$)**.
- **Engenharia de Recursos (Feature Engineering):**
  - Variáveis temporais extraídas da data (Dia da Semana, Dia do Mês, Mês do Ano).
  - Codificação de identificadores de produtos (*SKU/One-Hot*).
  - Normalização Min-Max para a quantidade vendida.
- **Arquitetura da Rede Neural (PyTorch):**
  - **Camada de Entrada:** 17 nós (produtos + sazonalidades de calendário).
  - **Camadas Ocultas:**
    - `Linear(17, 256)` + `ReLU` + `Dropout(0.20)`
    - `Linear(256, 128)` + `ReLU` + `Dropout(0.20)`
    - `Linear(128, 64)` + `ReLU`
  - **Camada de Saída:** `Linear(64, 7)` (7 neurônios contínuos, cada um prevendo um dia futuro).
  - **Otimização:** Otimizador Adam com taxa de aprendizado $\eta = 0.001$, regularização L2 (`weight_decay = 0.0001`) e função de custo Erro Quadrático Médio (`MSELoss`).
- **Validação:** Separação temporal (treino em 2023, validação e teste em 2024 para evitar *data leakage*).

### 2. Pesos Salvos (`pesos_modelo/`)
- Estado dos tensores e pesos aprendidos exportados com `torch.save(model.state_dict(), 'pesos_modelo.pth')`, preservados no repositório.

### 3. Integração em Produção na Aplicação Web (Serverless / Edge AI)
- **Exportação dos Pesos (`pesos_mlp.json`):** Os tensores treinados do PyTorch foram exportados em formato JSON compacto (~380 KB), viabilizando execução serverless 100% gratuita na Vercel sem necessidade de bibliotecas pesadas de Python.
- **Motor de Inferência em JavaScript (`mlpService.js` e `mlpInference.js`):**
  - Executa a passagem direta (*forward pass*) da rede neural calculando os produtos matriciais das camadas e ativações ReLU em menos de 1 milissegundo.
  - Constrói o vetor de 17 entradas (One-Hot do SKU + funções trigonométricas de sazonalidade temporal) e desnormaliza os 7 neurônios de saída pela escala do MinMaxScaler.
- **Visualização no Dashboard:** No Dashboard (`DemandForecastSection` e `DemandForecastChart`), os 7 dias projetados pela Rede Neural são plotados em tempo real na curva tracejada com o badge visual **MLP**, permitindo ao gestor antecipar a demanda semanal com precisão científica.

---

## 📁 Estrutura do Repositório

```text
flora-acessorios-pi4/
├── api/
│   └── index.js                                  # Ponto de entrada Serverless da API na Vercel
├── back-end/
│   ├── src/
│   │   ├── config/database.js                    # Conexão MySQL + Fallback Resiliente
│   │   ├── controllers/                          # Controllers (auth, produtos, vendas, dashboard)
│   │   └── routes/                               # Rotas Express REST
│   └── package.json
├── database/
│   ├── schema.sql                                # DDL completo com todas as tabelas
│   └── seed.sql                                  # DML de carga inicial com vendas e dados de IA
├── front-end/
│   ├── components/                               # Componentes modulares React (Dashboard, IA, etc.)
│   ├── lib/                                      # Provedores de inventário e cálculo preditivo
│   ├── pages/                                    # Telas (Home, Login, Orders, Products, etc.)
│   ├── services/api.js                           # Camada de comunicação HTTP
│   └── vite.config.js
├── pesos_modelo/                                 # Pesos treinados da Rede Neural (PyTorch)
├── Rede_Neural_Multilayer_Perceptron_MLP_(Teste).ipynb  # Treinamento e validação do modelo de IA
├── criar-banco.bat                               # Script Windows para criar e popular o MySQL
├── iniciar.bat                                   # Script Windows para subir Back + Front de uma vez
├── vercel.json                                   # Configuração de build e rotas para Vercel
├── DOCUMENTACAO_TECNICA_FLORA_PI4.md             # Documentação técnica detalhada do projeto
└── README.md
```

---

## 💻 Como Rodar Localmente (Windows + XAMPP)

Siga o passo a passo simplificado baseado no roteiro oficial do projeto:

### Pré-requisitos
1. **Node.js** (versão 18 ou superior instalada).
2. **XAMPP** com o serviço **MySQL** iniciado na porta padrão `3306` (usuário `root`, sem senha).

### 1️⃣ Criar e popular o Banco de Dados
Abra a pasta do projeto e dê um duplo clique no arquivo:
```cmd
criar-banco.bat
```
*(O script conectará ao MySQL do XAMPP, criará a base `flora_acessorios` e carregará as tabelas e dados de teste).*

### 2️⃣ Iniciar o Sistema Completo (Back-End + Front-End)
Dê um duplo clique no arquivo:
```cmd
iniciar.bat
```
*(O script instalará dependências se necessário e abrirá os terminais do Back-End na porta `3000` e Front-End na porta `5173`)*.

Acesse no navegador:
👉 **http://localhost:5173**

---

## ☁️ Deploy em Nuvem (Vercel)

O projeto foi configurado como um monorepo unificado pronto para a **Vercel**:
1. Conecte o repositório GitHub à Vercel.
2. Não altere o *Root Directory* (deixe a raiz `./`).
3. O arquivo [`vercel.json`](vercel.json) roteia automaticamente:
   - `/api/*` ➡️ Função Serverless [`api/index.js`](api/index.js) (Express).
   - `/*` ➡️ Aplicação React compilada (`front-end/dist`).
4. Possui camada de **persistência híbrida no navegador**, permitindo que o avaliador teste cadastros, exclusões e lançamentos de vendas diretamente em nuvem.

---

## 🔑 Credenciais de Teste

| Papel | E-mail | Senha |
| :--- | :--- | :--- |
| **Administrador Mestre** | `admin@flora.com` | `Flora2026@` |
| **Novo Usuário** | *Qualquer e-mail cadastrado na tela de registro* | *Senha definida no cadastro* |

---

## 📱 Telas e Funcionalidades

1. **Dashboard Principal (`/`):**
   - Cartões de KPI: Faturamento Total, Saúde do Estoque, Alertas de Estoque Mínimo.
   - Gráfico de Previsão de Demanda com IA e Tendências temporais.
   - Insights de Clientes e Produtos mais vendidos.
2. **Lançamento de Vendas & PDV (`/orders`):**
   - Registro de vendas com seleção de vendedor, produto, quantidade e valor.
   - Tabela em tempo real das vendas mais recentes.
3. **Catálogo de Produtos (`/products`):**
   - Listagem com alertas de nível crítico, ajuste rápido de estoque (+ / -) e importação CSV.
4. **Ranking de Vendedores (`/leaderboard`):**
   - Pódio dos vendedores com maior faturamento e número de transações.
5. **Relatórios e Histórico (`/sales-report` e `/history`):**
   - Análise de vendas agrupadas por mês e detalhamento transacional completo.
6. **Configurações & Categorias (`/settings`):**
   - Gerenciamento dinâmico de categorias de semijoias.

---

## 📄 Licença e Direitos

Projeto desenvolvido como parte dos requisitos do **Projeto Integrador (PI 4)** por estudantes de graduação. Uso acadêmico e institucional.
