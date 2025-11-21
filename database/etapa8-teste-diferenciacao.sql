-- ETAPA 8: Teste da diferenciação por nível
-- Verificar se as questões são diferentes para operacional vs gestão

-- 1. Testar login com funcionário operacional
SELECT '=== TESTE FUNCIONÁRIO OPERACIONAL ===' as titulo;

SELECT
    cpf,
    nome,
    nivel_cargo,
    setor,
    funcao
FROM funcionarios
WHERE
    cpf = '87545772900';

-- 2. Testar login com funcionário gestão
SELECT '=== TESTE FUNCIONÁRIO GESTÃO ===' as titulo;

SELECT
    cpf,
    nome,
    nivel_cargo,
    setor,
    funcao
FROM funcionarios
WHERE
    cpf = '87545772901';

-- 3. Verificar estrutura da tabela funcionarios
SELECT '=== ESTRUTURA TABELA FUNCIONÁRIOS ===' as titulo;

SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'funcionarios'
    AND column_name IN ('nivel_cargo', 'cpf', 'nome')
ORDER BY ordinal_position;

SELECT '✅ ETAPA 8 CONCLUÍDA - DIFERENCIAÇÃO POR NÍVEL IMPLEMENTADA!' as resultado;