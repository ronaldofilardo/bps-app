# 🔧 CORREÇÃO: Listagem de Grupos na Seção "Risco Psicossocial Elevado"

## ❌ Problema Identificado

Na seção **"3. Interpretação e Recomendações"**, dentro do box vermelho **"Risco Psicossocial Elevado (maior que 66%)"**, os grupos identificados **não estavam sendo listados corretamente**.

### Causas do Problema:

1. **Filtro incorreto em `laudo-calculos.ts`:**

   ```typescript
   // ANTES (ERRADO)
   const gruposBaixoRisco = scores.filter(
     (s) => s.classificacaoSemaforo === "verde" && s.categoriaRisco === "baixo"
   );
   const gruposMedioRisco = scores.filter(
     (s) =>
       s.classificacaoSemaforo === "amarelo" ||
       (s.classificacaoSemaforo === "verde" && s.categoriaRisco === "medio")
   );
   const gruposAltoRisco = scores.filter(
     (s) => s.classificacaoSemaforo === "vermelho"
   );
   ```

   ❌ Problemas:

   - Lógica confusa misturando `categoriaRisco` e `classificacaoSemaforo`
   - Não capturava todos os grupos de alto risco

2. **Propriedade errada no PDF (`route.ts`):**
   ```typescript
   // ANTES (ERRADO)
   ${etapa3.gruposAtencao.length > 0 ? `
   ```
   ❌ Estava usando `gruposAtencao` em vez de `gruposAltoRisco`

---

## ✅ Solução Implementada

### 1. Correção em `lib/laudo-calculos.ts`

Simplificamos a lógica para filtrar **diretamente pela categoriaRisco**:

```typescript
// DEPOIS (CORRETO)
const gruposBaixoRisco = scores.filter((s) => s.categoriaRisco === "baixo");
const gruposMedioRisco = scores.filter((s) => s.categoriaRisco === "medio");
const gruposAltoRisco = scores.filter((s) => s.categoriaRisco === "alto");
```

✅ **Vantagens:**

- Lógica mais simples e direta
- Não depende de múltiplas condições
- Usa a fonte única de verdade: `categoriaRisco`

### 2. Correção no PDF (`app/api/emissor/laudos/[loteId]/pdf/route.ts`)

```typescript
// ANTES (ERRADO)
${etapa3.gruposAtencao.length > 0 ? `

// DEPOIS (CORRETO)
${etapa3.gruposAltoRisco && etapa3.gruposAltoRisco.length > 0 ? `
```

E na renderização:

```typescript
// ANTES (ERRADO)
${etapa3.gruposAtencao.map((g: any) => `...`).join('')}

// DEPOIS (CORRETO)
${etapa3.gruposAltoRisco.map((g: any) => `...`).join('')}
```

---

## 📊 Exemplo Visual do Resultado

### ANTES da Correção:

```
┌──────────────────────────────────────────────────┐
│ 🔴 3. Risco Psicossocial Elevado (maior que 66%) │
│                                                  │
│ [Texto descritivo...]                           │
│                                                  │
│ Grupos identificados:                           │
│ Nenhum grupo identificado ❌                    │
└──────────────────────────────────────────────────┘
```

### DEPOIS da Correção:

```
┌──────────────────────────────────────────────────┐
│ 🔴 3. Risco Psicossocial Elevado (maior que 66%) │
│                                                  │
│ [Texto descritivo...]                           │
│                                                  │
│ Grupos identificados:                           │
│ • 2 - Organização e Conteúdo do Trabalho ✅     │
│ • 6 - Traços de Personalidade ✅                │
└──────────────────────────────────────────────────┘
```

---

## 🧪 Testes Implementados

Criado arquivo `__tests__/lib/interpretacao-grupos-alto-risco.test.ts` com **9 testes** cobrindo:

1. ✅ Classificação correta dos grupos por categoria de risco
2. ✅ Inclusão de grupos de alto risco na lista `gruposAltoRisco`
3. ✅ Menção dos grupos no texto principal
4. ✅ Separação correta de grupos positivos com baixa pontuação
5. ✅ Separação correta de grupos negativos com baixa pontuação
6. ✅ Não haver duplicação entre categorias
7. ✅ Soma total dos grupos classificados
8. ✅ Comportamento quando não há grupos de alto risco
9. ✅ Comportamento quando há apenas grupos de alto risco

**Resultado: 9/9 testes passando ✅**

---

## 📝 Arquivos Modificados

1. **`lib/laudo-calculos.ts`** (linha ~319)
   - Simplificou filtros de classificação de risco
2. **`app/api/emissor/laudos/[loteId]/pdf/route.ts`** (linha ~643)

   - Corrigiu referência de `gruposAtencao` → `gruposAltoRisco`

3. **`app/emissor/laudo/[loteId]/page.tsx`**
   - ✅ Já estava correto (usando `gruposAltoRisco`)

---

## 🎯 Impacto

### Antes:

- ❌ Box vermelho mostrava "Nenhum grupo identificado"
- ❌ Usuário não sabia quais grupos tinham risco elevado
- ❌ Informação inconsistente entre tabela e interpretação

### Depois:

- ✅ Box vermelho lista **todos os grupos com alto risco**
- ✅ Consistência total entre tabela de scores e interpretação
- ✅ Facilita identificação de áreas críticas para intervenção
- ✅ Alinhamento com requisitos da NR-01

---

## 🔗 Relacionado

Esta correção complementa a **CORRECAO-CLASSIFICACAO-RISCO.md**, garantindo que:

1. A classificação esteja correta (faixas 33% e 66%)
2. Os grupos corretamente classificados sejam exibidos na interpretação

---

**Data da Correção:** 2 de dezembro de 2025  
**Desenvolvedor:** GitHub Copilot  
**Status:** ✅ Implementado e Validado
