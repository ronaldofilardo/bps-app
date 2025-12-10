# 🔐 Resolver Erro 401 - Vercel Deployment Protection

## 🎯 O Problema

Você está vendo o erro **401 (Unauthorized)** ao acessar o deployment porque o **Vercel Deployment Protection** está ativo no preview deployment.

**Esse NÃO é um bug da aplicação!** É uma proteção de segurança do Vercel.

## ✅ Solução Rápida (Recomendada)

### **Opção 1: Desabilitar Deployment Protection**

1. **Acesse o Dashboard do Vercel:**

   - https://vercel.com/ronaldofilardo/nr-bps-popup-clean/settings/deployment-protection

2. **Desmarque "Vercel Authentication":**
   - Vá para **Settings > Deployment Protection**
   - Em **"Protection Settings"**, desabilite:
     - ❌ **Vercel Authentication** (desmarcar)
3. **Salve as alterações**

4. **Aguarde o próximo deploy** ou force um redeploy:
   - Vá para: https://vercel.com/ronaldofilardo/nr-bps-popup-clean
   - Clique em "Redeploy" no último deployment

### **Resultado:**

✅ O erro 401 desaparecerá  
✅ O manifest.json será acessível  
✅ O PWA funcionará normalmente  
✅ A aplicação ficará publicamente acessível

---

## 🔐 Opção 2: Bypass Temporário (Desenvolvimento)

Se você quiser manter a proteção mas acessar temporariamente:

1. **Obter Bypass Token:**

   - Acesse: https://vercel.com/ronaldofilardo/nr-bps-popup-clean/settings/deployment-protection
   - Copie o **Protection Bypass for Automation**

2. **Usar URL com Bypass:**

   ```
   https://bps-o7e1c8icc-ronaldofilardos-projects.vercel.app?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=SEU_TOKEN_AQUI
   ```

3. **Após acessar uma vez**, o cookie será setado e você poderá navegar normalmente

---

## 🚀 Opção 3: Usar Domínio de Produção

O domínio de produção **não tem essa proteção**:

✅ **Use:** https://nr-bps-popup-clean.vercel.app  
❌ **Evite:** https://bps-o7e1c8icc-ronaldofilardos-projects.vercel.app (preview)

**O domínio de produção sempre estará acessível sem autenticação.**

---

## 📊 O Que São Preview Deployments?

- **Preview Deployments** são criados automaticamente para cada branch/PR
- São usados para **testar** antes de ir para produção
- Por padrão, o Vercel os protege com autenticação

**URL Pattern:**

- Preview: `https://bps-xxxxx-ronaldofilardos-projects.vercel.app`
- Produção: `https://nr-bps-popup-clean.vercel.app`

---

## 🔍 Identificando o Tipo de Deployment

### Preview (com proteção):

```
https://bps-o7e1c8icc-ronaldofilardos-projects.vercel.app
              ↑ hash aleatório
```

### Produção (sem proteção):

```
https://nr-bps-popup-clean.vercel.app
       ↑ nome do projeto
```

---

## ⚙️ Configuração Atual

Arquivo `vercel.json` criado para otimizar o cache do manifest:

```json
{
  "headers": [
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

---

## ✅ Checklist de Resolução

- [ ] Acessar Settings > Deployment Protection no Vercel
- [ ] Desabilitar "Vercel Authentication"
- [ ] Salvar alterações
- [ ] Fazer redeploy ou aguardar próximo deploy
- [ ] Testar no domínio de produção: https://nr-bps-popup-clean.vercel.app
- [ ] Confirmar que manifest.json carrega sem erro 401

---

## 🐛 Se o Erro Persistir

1. **Limpe o cache do navegador:**

   - Chrome: `Ctrl + Shift + Delete`
   - Selecione "Cookies e dados do site"
   - Limpe e recarregue

2. **Teste em aba anônima:**

   - Chrome: `Ctrl + Shift + N`
   - Acesse a URL novamente

3. **Verifique o domínio:**
   - Certifique-se de usar o domínio de **produção**
   - Não use URLs de preview para testes finais

---

## 📝 Recomendação Final

**Para desenvolvimento e testes:**
✅ Desabilite Deployment Protection  
✅ Use o domínio de produção  
✅ Mantenha o vercel.json configurado

**Depois que tudo funcionar, você pode:**

- Reativar a proteção apenas para preview deployments
- Manter produção sempre pública

---

## 📞 Links Úteis

- **Vercel Dashboard:** https://vercel.com/ronaldofilardo/nr-bps-popup-clean
- **Deployment Protection:** https://vercel.com/ronaldofilardo/nr-bps-popup-clean/settings/deployment-protection
- **Documentação Vercel:** https://vercel.com/docs/security/deployment-protection
- **Produção:** https://nr-bps-popup-clean.vercel.app

---

**Após seguir as instruções acima, o erro 401 será resolvido! 🎉**
