## 🔧 Instruções de Deploy na Vercel

### Passo 1: Preparar o repositório

```powershell
git init
git add .
git commit -m "Initial commit: BPS Brasil"
```

### Passo 2: Criar banco Neon

1. Acesse https://console.neon.tech
2. Crie um novo projeto: "bps-brasil"
3. Copie a Connection String
4. Execute o schema SQL no banco Neon

### Passo 3: Deploy na Vercel

1. Instale Vercel CLI:

```powershell
npm i -g vercel
```

2. Faça login:

```powershell
vercel login
```

3. Deploy:

```powershell
vercel --prod
```

### Passo 4: Configurar variáveis de ambiente

No painel da Vercel, adicione:

```
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/bps_brasil?sslmode=require
SESSION_SECRET=seu_secret_de_32_caracteres_aqui
NODE_ENV=production
```

### Passo 5: Verificar

Acesse sua URL da Vercel e teste o login!

---

## 🔄 Atualizações

Para deployar atualizações:

```powershell
git add .
git commit -m "Sua mensagem"
git push
vercel --prod
```

---

## 📊 Monitoramento

- Logs: https://vercel.com/dashboard
- Banco: https://console.neon.tech
- Analytics: Dashboard RH do sistema
