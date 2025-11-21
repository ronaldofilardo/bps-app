# 🔐 GUIA DE LOGINS - BPS BRASIL COPSOQ III

## 📋 **HIERARQUIA DO SISTEMA**

### 🎯 **MASTER ADMIN** (Super Usuário - Dono do App)

- **Função:** Gerencia TODAS as clínicas do sistema
- **CPF:** `00000000000`
- **Senha:** `master123`
- **Acesso:** `/master` - Tela "Gerenciar Clínicas"
- **Visibilidade:** ❌ **NÃO aparece** na lista de funcionários das clínicas
- **Responsabilidade:**
  - Criar/ativar/desativar clínicas
  - Visão global do sistema
  - Super administração

---

### 🔧 **ADMIN CLÍNICA** (Administrador da Clínica)

- **Função:** Gerencia funcionários de UMA clínica específica
- **CPF:** `11111111111`
- **Senha:** `admin123`
- **Acesso:** `/admin` - Tela "Administração"
- **Visibilidade:** ✅ Aparece na lista (pode ser funcionário da própria clínica)
- **Responsabilidade:**
  - Upload/importar funcionários
  - Gerenciar perfis (funcionário, RH, admin)
  - Administração interna da clínica

---

### 👥 **RH GESTOR** (Gestor de Recursos Humanos)

- **Função:** Libera avaliações e visualiza resultados
- **CPF:** `22222222222`
- **Senha:** `rh123`
- **Acesso:** `/rh` - Dashboard RH
- **Visibilidade:** ✅ Aparece na lista (funcionário da clínica)
- **Responsabilidade:**
  - Liberar avaliações para funcionários
  - Ver dashboard com resultados
  - Gerar relatórios

---

### 👤 **FUNCIONÁRIO** (Usuário final)

- **Função:** Responde questionários de avaliação psicossocial
- **CPF:** Cadastrado pela clínica
- **Senha:** Definida no cadastro
- **Acesso:** `/dashboard` - Responder avaliação
- **Visibilidade:** ✅ Aparece na lista
- **Responsabilidade:**
  - Responder questionário COPSOQ III
  - Ver seu próprio resultado

---

## ⚠️ **IMPORTANTE - SEPARAÇÃO DE RESPONSABILIDADES**

### 🎯 **Master Admin vs Admin Clínica:**

- **Master Admin (00000000000):** Dono do software, gerencia clínicas
- **Admin Clínica (11111111111):** Funcionário de uma clínica específica

### 🔒 **Isolamento Multi-tenant:**

- Cada clínica só vê seus próprios funcionários
- Master Admin vê todas as clínicas mas não aparece nas listas internas
- Dados completamente isolados por clínica

---

## ✅ **STATUS ATUAL - ETAPA 1 CONCLUÍDA**

**Implementado:**

- ✅ Tabela de clínicas
- ✅ Perfil "master" adicionado
- ✅ Master Admin criado e funcional
- ✅ Tela de gerenciamento de clínicas
- ✅ Master Admin removido da lista de funcionários das clínicas
- ✅ APIs corrigidas para não mostrar master nos relatórios internos

**Teste de Aceitação:**

- ✅ Login Master Admin → Tela "Gerenciar Clínicas"
- ✅ Master Admin não aparece na lista de funcionários do Admin

**Próximo:** Etapa 2 - Multi-tenancy (isolamento por clínica)
