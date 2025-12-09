# 🚀 ATUALIZAR VARIÁVEIS NO VERCEL

## ⚠️ AÇÃO NECESSÁRIA

Você precisa atualizar a variável `DATABASE_URL` no Vercel para incluir o `search_path`.

---

## 📋 Passo a Passo

### 1. Acesse o Painel do Vercel

https://vercel.com/ronaldofilardo/nr-bps-popup-clean/settings/environment-variables

### 2. Localize a Variável `DATABASE_URL`

Encontre a variável de ambiente `DATABASE_URL` na seção "Production".

### 3. Atualize o Valor

**VALOR ANTIGO:**

```
postgresql://neondb_owner:npg_NfJGO8vck9ob@ep-steep-credit-acckkvg4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**NOVO VALOR (COPIE ESTE):**

```
postgresql://neondb_owner:npg_NfJGO8vck9ob@ep-steep-credit-acckkvg4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&options=-c%20search_path%3Dpublic
```

**O que mudou?**  
Adicionado no final: `&options=-c%20search_path%3Dpublic`

### 4. Salvar e Redesployar

Após atualizar:

1. Clique em **"Save"**
2. Vá para: https://vercel.com/ronaldofilardo/nr-bps-popup-clean
3. Clique em **"Redeploy"** no último deployment
4. Aguarde o build finalizar (1-2 minutos)

---

## 🔍 Verificar se Precisa Atualizar

**Opção 1: Verificar no Vercel Dashboard**

1. Acesse: https://vercel.com/ronaldofilardo/nr-bps-popup-clean/settings/environment-variables
2. Clique para ver o valor de `DATABASE_URL`
3. Confira se termina com `&options=-c%20search_path%3Dpublic`

**Opção 2: Testar a Aplicação**

1. Acesse: https://nr-bps-popup-clean.vercel.app
2. Tente fazer login
3. Se aparecer erro de banco de dados, precisa atualizar

---

## ✅ Outras Variáveis (Verificar)

Certifique-se de que essas variáveis também estão configuradas:

### `NODE_ENV`

```
production
```

### `SESSION_SECRET`

```
seu-secret-super-seguro-aqui-com-32-caracteres
```

(Ou qualquer secret de 32+ caracteres)

---

## 🎯 Resultado Esperado

Após atualizar e redesployar:

✅ Login funciona normalmente  
✅ APIs conectam no banco corretamente  
✅ Dados carregam sem erros  
✅ Mesma experiência de desenvolvimento

---

## 🐛 Se Houver Erro

### Erro: "Nenhuma conexão configurada para ambiente: production"

**Causa:** Variável `DATABASE_URL` não configurada ou incorreta.

**Solução:**

1. Verifique se a variável está em "Production"
2. Confirme que o valor está correto (com search_path)
3. Redesploye a aplicação

### Erro: "relation 'clinicas' does not exist"

**Causa:** `search_path` não configurado.

**Solução:**

1. Adicione `&options=-c%20search_path%3Dpublic` na URL
2. Redesploye

### Erro: "password authentication failed"

**Causa:** Senha incorreta na URL de conexão.

**Solução:**

1. Verifique as credenciais no Neon Dashboard
2. Atualize a `DATABASE_URL`
3. Redesploye

---

## 📞 Links Úteis

- **Vercel Project:** https://vercel.com/ronaldofilardo/nr-bps-popup-clean
- **Environment Variables:** https://vercel.com/ronaldofilardo/nr-bps-popup-clean/settings/environment-variables
- **Deployments:** https://vercel.com/ronaldofilardo/nr-bps-popup-clean/deployments
- **Logs:** https://vercel.com/ronaldofilardo/nr-bps-popup-clean/logs

---

## 🚀 Checklist de Atualização

- [ ] Acessei o painel do Vercel
- [ ] Localizei a variável `DATABASE_URL`
- [ ] Atualizei com o novo valor (com search_path)
- [ ] Salvei as alterações
- [ ] Fiz redeploy da aplicação
- [ ] Aguardei o build finalizar
- [ ] Testei o login em produção
- [ ] Tudo funcionando! ✅

---

**Depois de atualizar o Vercel, teste imediatamente usando o arquivo `TESTE-RAPIDO.md`** 🎉
