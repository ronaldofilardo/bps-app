# 🚀 Início Rápido - BPS Brasil

## 5 Passos para Começar

### 1️⃣ Instalar Dependências (2 minutos)

```powershell
cd c:\apps\NR-BPS
npm install
```

---

### 2️⃣ Configurar Banco de Dados Local (5 minutos)

**Opção A: Script Automático**

```powershell
.\setup.ps1
```

**Opção B: Manual**

```powershell
# Criar banco
psql -U postgres -c "CREATE DATABASE bps_brasil;"

# Executar schema
psql -U postgres -d bps_brasil -f database\schema.sql
```

---

### 3️⃣ Configurar .env (2 minutos)

Crie o arquivo `.env` na raiz:

```env
NODE_ENV=development
LOCAL_DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/bps_brasil
SESSION_SECRET=insira_32_caracteres_aleatorios_aqui
```

**Gerar SESSION_SECRET:**

```powershell
# No PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

### 4️⃣ Iniciar Servidor (1 minuto)

```powershell
npm run dev
```

Aguarde aparecer:

```
✓ Ready on http://localhost:3000
```

---

### 5️⃣ Testar Sistema (5 minutos)

**Abra o navegador:** http://localhost:3000

**Login Admin:**

- CPF: `00000000000`
- Senha: `admin123`

**Login RH:**

- CPF: `11111111111`
- Senha: `rh123`

---

## ✅ Checklist Rápido

- [ ] Sistema abre no navegador
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Consegue iniciar avaliação
- [ ] Navegação entre grupos OK
- [ ] Respostas salvam
- [ ] Dashboard RH mostra gráficos
- [ ] Área Admin permite importar CSV

---

## 🎯 Próximos Passos

### Para Desenvolvimento

1. Leia o **README.md** completo
2. Explore o **GUIA-DE-USO.md**
3. Customize conforme necessário

### Para Produção

1. Siga o **DEPLOY.md**
2. Use o **CHECKLIST.md**
3. Configure monitoramento

---

## 🐛 Problemas Comuns

### "Não conecta no banco"

```powershell
# Verificar se PostgreSQL está rodando
Get-Service postgresql*

# Iniciar se necessário
Start-Service postgresql-x64-14
```

### "Erro ao importar módulo"

```powershell
# Reinstalar
Remove-Item -Recurse node_modules
npm install
```

### "Porta 3000 já está em uso"

```powershell
# Matar processo
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force

# Ou usar outra porta
$env:PORT=3001; npm run dev
```

---

## 📚 Documentação Completa

| Documento               | Para quem       | Conteúdo                |
| ----------------------- | --------------- | ----------------------- |
| **README.md**           | Todos           | Visão geral do sistema  |
| **INICIO-RAPIDO.md**    | Iniciantes      | Este arquivo            |
| **GUIA-DE-USO.md**      | Usuários finais | Como usar o sistema     |
| **DEPLOY.md**           | DevOps          | Como fazer deploy       |
| **SOBRE-COPSOQ.md**     | RH/Gestão       | Fundamentos científicos |
| **TROUBLESHOOTING.md**  | TI/Suporte      | Resolução de problemas  |
| **CHECKLIST.md**        | Gestores        | Lista de verificação    |
| **RESUMO-EXECUTIVO.md** | Executivos      | Visão de negócio        |

---

## 💡 Dicas Profissionais

### VSCode Extensions Recomendadas

- **ES7+ React/Redux** - Snippets
- **Tailwind CSS IntelliSense** - Autocomplete
- **Prisma** (futuro) - Se migrar para Prisma
- **Thunder Client** - Testar APIs

### Atalhos Úteis

```powershell
# Ver logs em tempo real
npm run dev | Select-String "error|warning"

# Build de produção
npm run build
npm start

# Verificar erros TypeScript
npx tsc --noEmit
```

### Chrome DevTools

- **F12** - Abrir DevTools
- **Application > Service Workers** - Ver PWA
- **Application > IndexedDB** - Ver dados offline
- **Network** - Debugar requisições
- **Console** - Ver erros JavaScript

---

## 🎓 Aprenda Mais

### Tecnologias Usadas

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Chart.js](https://www.chartjs.org/docs)
- [PostgreSQL](https://www.postgresql.org/docs/)

### Deploy e Hospedagem

- [Vercel Docs](https://vercel.com/docs)
- [Neon Docs](https://neon.tech/docs)

---

## 🤝 Contribuindo

### Melhorias Bem-vindas

- 🐛 Reportar bugs
- ✨ Sugerir features
- 📝 Melhorar documentação
- 🎨 Aprimorar UI/UX

### Estrutura de Pastas

```
/app          → Páginas Next.js
/components   → Componentes React
/lib          → Utilitários e lógica
/public       → Arquivos estáticos
/database     → Schemas e seeds SQL
```

---

## ⏱️ Tempo Estimado de Setup

| Etapa                 | Tempo  | Acumulado |
| --------------------- | ------ | --------- |
| Instalar Node.js      | 5 min  | 5 min     |
| Instalar PostgreSQL   | 10 min | 15 min    |
| Clonar/Criar projeto  | 2 min  | 17 min    |
| Instalar dependências | 3 min  | 20 min    |
| Configurar banco      | 5 min  | 25 min    |
| Configurar .env       | 2 min  | 27 min    |
| Primeiro run          | 2 min  | 29 min    |
| Testes básicos        | 10 min | 39 min    |

**Total: ~40 minutos** para estar rodando localmente! ⚡

---

## 🎉 Pronto!

Você agora tem:

- ✅ Sistema rodando localmente
- ✅ Banco de dados configurado
- ✅ Usuários de teste criados
- ✅ PWA funcional

### Explore o Sistema

1. Faça login como funcionário e complete uma avaliação
2. Faça login como RH e veja o dashboard
3. Faça login como Admin e importe funcionários

### Quando Estiver Pronto

- 📖 Leia a documentação completa
- 🚀 Faça deploy na Vercel
- 👥 Cadastre usuários reais
- 📊 Comece a coletar dados!

---

**Dúvidas?** Consulte **TROUBLESHOOTING.md**

**Bom trabalho!** 🚀
