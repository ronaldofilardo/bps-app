# 🔧 Troubleshooting - BPS Brasil

## Problemas Comuns e Soluções

### 1. Erro ao instalar dependências

**Problema:** `npm install` falha

**Soluções:**

```powershell
# Limpar cache do npm
npm cache clean --force

# Deletar node_modules e reinstalar
Remove-Item -Recurse -Force node_modules
npm install

# Usar versão LTS do Node.js
node --version  # Deve ser >= 18.0.0
```

---

### 2. Erro de conexão com banco de dados

**Problema:** `Error: connect ECONNREFUSED`

**Soluções:**

**PostgreSQL Local:**

```powershell
# Verificar se PostgreSQL está rodando
Get-Service -Name postgresql*

# Iniciar serviço
Start-Service postgresql-x64-14  # Ajuste a versão

# Testar conexão
psql -U postgres -d bps_brasil -c "SELECT NOW();"
```

**Neon (Produção):**

- Verifique se a URL está correta no `.env`
- Confirme que o IP está na whitelist do Neon
- Teste a conexão: https://console.neon.tech

---

### 3. Erro "Module not found"

**Problema:** `Cannot find module '@/lib/...'`

**Soluções:**

```powershell
# Verificar tsconfig.json
Get-Content tsconfig.json | Select-String "paths"

# Reinstalar dependências TypeScript
npm install --save-dev @types/node @types/react

# Reiniciar servidor
# Ctrl+C e depois:
npm run dev
```

---

### 4. Página em branco / erro 404

**Problema:** Página não carrega após deploy

**Soluções:**

```powershell
# Build local para testar
npm run build
npm start

# Verificar logs da Vercel
vercel logs

# Verificar variáveis de ambiente
vercel env ls
```

---

### 5. Service Worker não registra

**Problema:** PWA não funciona offline

**Soluções:**

```javascript
// Verificar no DevTools do navegador:
// Application > Service Workers

// Limpar cache e re-registrar
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => reg.unregister());
  });
  window.location.reload();
}
```

---

### 6. Erro ao fazer login

**Problema:** "CPF ou senha inválidos" mesmo com dados corretos

**Soluções:**

```sql
-- Verificar se usuário existe
SELECT cpf, nome, perfil, ativo FROM funcionarios WHERE cpf = '00000000000';

-- Resetar senha do admin
UPDATE funcionarios
SET senha_hash = '$2a$10$Z3QK5YrKGQJN5yXZ9K5yXOK5YrKGQJN5yXZ9K5yXOK5YrKGQJN5yX'
WHERE cpf = '00000000000';
-- Nova senha: admin123

-- Verificar se está ativo
UPDATE funcionarios SET ativo = TRUE WHERE cpf = '00000000000';
```

---

### 7. Gráficos não aparecem no Dashboard RH

**Problema:** Dashboard carrega mas gráficos ficam em branco

**Soluções:**

```powershell
# Verificar instalação do Chart.js
npm list chart.js react-chartjs-2

# Reinstalar se necessário
npm uninstall chart.js react-chartjs-2
npm install chart.js@^4.4.0 react-chartjs-2@^5.2.0

# Limpar cache do navegador
# DevTools > Application > Clear Storage
```

---

### 8. Erro ao importar CSV

**Problema:** Importação falha ou dados incorretos

**Soluções:**

```powershell
# Verificar formato do CSV
# Deve ser UTF-8, vírgula como separador

# Exemplo correto:
# cpf,nome,setor,funcao,email,perfil
# 12345678901,João Silva,TI,Dev,joao@empresa.com,funcionario

# Remover BOM se existir
$content = Get-Content funcionarios.csv -Raw
$content = $content -replace '\uFEFF', ''
$content | Set-Content funcionarios-limpo.csv -NoNewline
```

---

### 9. Lentidão no sistema

**Problema:** Sistema lento ou timeouts

**Soluções:**

**Backend:**

```sql
-- Verificar índices
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';

-- Otimizar queries lentas
EXPLAIN ANALYZE SELECT * FROM avaliacoes WHERE funcionario_cpf = '12345678901';

-- Limpar dados antigos se necessário
DELETE FROM avaliacoes WHERE status = 'iniciada' AND inicio < NOW() - INTERVAL '30 days';
```

**Frontend:**

```javascript
// Verificar no DevTools:
// Network > Slow 3G (testar conexão lenta)
// Performance > Record (analisar gargalos)
```

---

### 10. Erro 500 nas APIs

**Problema:** Internal Server Error

**Soluções:**

```powershell
# Ver logs em desenvolvimento
# Olhar o terminal onde npm run dev está rodando

# Ver logs na Vercel
vercel logs --follow

# Testar API manualmente
curl http://localhost:3000/api/auth/session

# Verificar variáveis de ambiente
Get-Content .env
```

---

## 🔍 Ferramentas de Debug

### DevTools do Navegador

**Console:**

```javascript
// Ver status do Service Worker
navigator.serviceWorker.getRegistrations();

// Ver dados no IndexedDB
// Application > IndexedDB > bps-brasil-db

// Ver cookies de sessão
// Application > Cookies > localhost
```

**Network:**

- Verificar requests falhando
- Ver tempo de resposta das APIs
- Inspecionar payloads JSON

### VSCode

**Debug Configuration (.vscode/launch.json):**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    }
  ]
}
```

### PostgreSQL

**Queries úteis:**

```sql
-- Ver todas as tabelas
\dt

-- Contar registros
SELECT
  'funcionarios' as tabela, COUNT(*) FROM funcionarios
UNION ALL
SELECT 'avaliacoes', COUNT(*) FROM avaliacoes
UNION ALL
SELECT 'respostas', COUNT(*) FROM respostas;

-- Ver últimas avaliações
SELECT * FROM avaliacoes ORDER BY inicio DESC LIMIT 10;

-- Ver erros de constraint
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'respostas'::regclass;
```

---

## 📝 Logs e Monitoramento

### Desenvolvimento (Local)

```powershell
# Logs do servidor Next.js
npm run dev > logs.txt 2>&1

# Logs do PostgreSQL (Windows)
Get-Content "C:\Program Files\PostgreSQL\14\data\log\*.log" -Tail 50
```

### Produção (Vercel)

```powershell
# Ver logs em tempo real
vercel logs --follow

# Ver logs de uma função específica
vercel logs --follow --output api/auth/login

# Ver logs por timestamp
vercel logs --since=1h
vercel logs --until=30m
```

### Banco Neon

1. Acesse: https://console.neon.tech
2. Selecione seu projeto
3. Aba "Monitoring"
4. Veja métricas de CPU, memória e queries

---

## 🆘 Quando Pedir Ajuda

Inclua as seguintes informações:

1. **Descrição do problema**

   - O que você tentou fazer?
   - O que aconteceu?
   - O que você esperava?

2. **Ambiente**

   - Desenvolvimento ou Produção?
   - Navegador e versão
   - Sistema operacional

3. **Logs de erro**

   - Console do navegador (F12)
   - Terminal do servidor
   - Logs da Vercel

4. **Steps to reproduce**

   - Passo a passo para recriar o erro

5. **Screenshots**
   - Capturas da tela de erro
   - Mensagens completas

---

## 📚 Recursos Adicionais

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Neon](https://neon.tech/docs)
- [PostgreSQL Manual](https://www.postgresql.org/docs/)

---

**Ainda com problemas?** Entre em contato com a equipe de TI.
