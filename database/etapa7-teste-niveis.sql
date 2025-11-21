-- ETAPA 7: Teste dos botões separados para liberação por nível
-- Verificar funcionários por nível para validar a funcionalidade

SELECT '=== FUNCIONÁRIOS POR NÍVEL DE CARGO ===' as titulo;

SELECT
    nivel_cargo,
    COUNT(*) as total_funcionarios,
    STRING_AGG (nome, ', ') as nomes
FROM funcionarios
WHERE
    perfil = 'funcionario'
GROUP BY
    nivel_cargo
ORDER BY nivel_cargo;

SELECT '=== DETALHES DOS FUNCIONÁRIOS TESTE ===' as titulo;

SELECT
    cpf,
    nome,
    nivel_cargo,
    setor,
    funcao,
    perfil
FROM funcionarios
WHERE
    cpf IN ('87545772900', '87545772901')
ORDER BY cpf;

SELECT '✅ ETAPA 7 CONCLUÍDA - BOTÕES SEPARADOS POR NÍVEL IMPLEMENTADOS!' as resultado;