# BPS Brasil - Sistema de Avaliação Psicossocial

Sistema de avaliação psicossocial baseado no questionário COPSOQ III (versão média), com módulos integrados de Jogos de Azar (JZ) e Endividamento Financeiro (EF).

## 🚀 Características

- **Progressive Web App (PWA)** - Funciona offline
- **100% Serverless** - Deploy na Vercel
- **Autenticação Segura** - Sessão via cookies httpOnly
- **Multi-perfil** - Funcionário, RH e Administrador
- **10 Grupos de Avaliação** - 70 itens + módulos JZ e EF
- **Dashboard Analítico** - Gráficos e semáforo de riscos
- **Exportação** - PDF e Excel
- **Banco de Dados** - Neon (produção) e PostgreSQL local (desenvolvimento)

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ (para desenvolvimento local)
- Conta Vercel (para deploy)
- Conta Neon Console (para produção)

## 🔧 Instalação

### 1. Instalar dependências

```powershell
npm install
```

### 2. Configurar Bancos de Dados

#### 🚀 Setup Automático (Recomendado)

Execute o script PowerShell que configura automaticamente os bancos:

```powershell
# Execute no PowerShell como Administrador
.\setup-databases.ps1
```

O script irá:

- ✅ Criar banco `nr-bps_db` (desenvolvimento)
- ✅ Criar banco `nr-bps_db_test` (testes)
- ✅ Aplicar schema completo em ambos
- ✅ Inserir usuários de teste
- ✅ Configurar arquivo `.env` automaticamente

#### 🔧 Setup Manual

Se preferir configurar manualmente:

```sql
-- No pgAdmin 4 ou psql, crie os bancos:
CREATE DATABASE nr_bps_db;        -- Desenvolvimento
CREATE DATABASE nr_bps_db_test;   -- Testes
```

Execute o schema em ambos:

```powershell
# Banco de desenvolvimento
psql -U postgres -d nr-bps_db -f database/schema-complete.sql

# Banco de testes
psql -U postgres -d nr-bps_db_test -f database/schema-complete.sql
```

### 3. Configuração de Ambientes

O sistema usa diferentes bancos para cada ambiente:

```bash
# Desenvolvimento (usa nr-bps_db)
NODE_ENV=development
cp .env.development .env

# Testes (usa nr-bps_db_test)
NODE_ENV=test

# Produção (usa Neon)
NODE_ENV=production
```

### 4. Executar Aplicação

```powershell
# Desenvolvimento
npm run dev

# Testes
npm test

# Build para produção
npm run build
npm start
```

**Acesse:** http://localhost:3000

## 👥 Usuários de Teste

Após o setup dos bancos, estão disponíveis:

| Perfil          | CPF           | Senha      | Descrição                          |
| --------------- | ------------- | ---------- | ---------------------------------- |
| **admin**       | `00000000000` | `admin123` | Administrador completo do sistema  |
| **rh**          | `11111111111` | `rh123`    | Gerente de Recursos Humanos        |
| **funcionario** | `22222222222` | `func123`  | Funcionário padrão para avaliações |

## 🗄️ Estrutura do Banco

- `funcionarios` - Cadastro de usuários
- `avaliacoes` - Registros de avaliações
- `respostas` - Respostas individuais
- `resultados` - Scores calculados

## 📊 Grupos de Avaliação

1. **Demandas no Trabalho** (11 itens)
2. **Organização e Conteúdo** (8 itens)
3. **Relações Interpessoais** (9 itens)
4. **Interface Trabalho-Indivíduo** (6 itens)
5. **Valores no Trabalho** (8 itens)
6. **Personalidade** (5 itens - opcional)
7. **Saúde e Bem-Estar** (8 itens)
8. **Comportamentos Ofensivos** (3 itens)
9. **Jogos de Azar (JZ)** (6 itens)
10. **Endividamento (EF)** (6 itens)

## 🚀 Deploy na Vercel

### 1. Conectar repositório

```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin seu_repositorio
git push -u origin main
```

### 2. Configurar Vercel

1. Acesse https://vercel.com
2. Importe o repositório
3. Configure as variáveis de ambiente:
   - `DATABASE_URL` (URL do Neon)
   - `SESSION_SECRET`
   - `NODE_ENV=production`

### 3. Deploy

```powershell
vercel --prod
```

## 📚 Documentação Adicional

- [🗄️ Configuração dos Bancos de Dados](docs/DATABASE_SETUP.md)
- [🛠️ Guia de Desenvolvimento](docs/DEVELOPMENT_GUIDE.md)
- [📋 Questionário COPSOQ III](docs/COPSOQ_GUIDE.md)
- [🎰 Módulos JZ e EF](docs/MODULES_GUIDE.md)
- [🔌 API Reference](docs/API_REFERENCE.md)
- [🚀 Guia de Deploy](docs/DEPLOY_GUIDE.md)

## 📱 PWA - Instalação

O aplicativo pode ser instalado em dispositivos móveis e desktops:

1. Acesse o site
2. Clique em "Instalar" no navegador
3. O app funcionará offline após a primeira visita

---

## ⚙️ Configurações Técnicas

### Ambientes de Banco de Dados

| Ambiente            | Banco            | URL                                                          | Uso                   |
| ------------------- | ---------------- | ------------------------------------------------------------ | --------------------- |
| **Desenvolvimento** | `nr-bps_db`      | `postgresql://postgres:123456@localhost:5432/nr-bps_db`      | Desenvolvimento local |
| **Testes**          | `nr-bps_db_test` | `postgresql://postgres:123456@localhost:5432/nr-bps_db_test` | Testes automatizados  |
| **Produção**        | Neon Cloud       | Via `DATABASE_URL`                                           | Deploy Vercel         |

### Scripts Disponíveis

```bash
npm run dev          # Servidor desenvolvimento (porta 3000)
npm test            # Executar testes (usa banco de testes)
npm run build       # Build para produção
npm start           # Executar build local
npm run lint        # Verificar código
```

## 🔒 Segurança

- Senhas com hash bcrypt
- Sessões via cookies httpOnly
- Sem JWT no MVP (simplificado)
- SQL preparado (previne injection)
- HTTPS obrigatório em produção

## 📄 Importar Funcionários (CSV)

Formato do arquivo CSV:

```csv
cpf,nome,setor,funcao,email,perfil
12345678901,João Silva,TI,Desenvolvedor,joao@empresa.com,funcionario
98765432100,Maria Santos,RH,Gestora,maria@empresa.com,rh
```

Acesse: `/admin` → "Escolher Arquivo CSV"

## 🛠️ Tecnologias

- **Frontend**: React 19 + Next.js 14 + TypeScript
- **Styling**: Tailwind CSS
- **Estado**: Zustand
- **Offline**: IndexedDB + Service Worker
- **Backend**: Vercel API Routes (Serverless)
- **Banco**: Neon PostgreSQL / PostgreSQL Local
- **Gráficos**: Chart.js + react-chartjs-2
- **PDF/Excel**: jsPDF + XLSX

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de TI.

---

**BPS Brasil** © 2024 - Sistema de Avaliação Psicossocial COPSOQ III
