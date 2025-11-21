-- ETAPA 13: Filtros por empresa nos dashboards
-- Implementar filtros para clínicas com múltiplas empresas clientes

-- 1. Criar view para dashboards com filtros por empresa
CREATE OR REPLACE VIEW vw_dashboard_por_empresa AS
SELECT
    f.clinica_id,
    ec.id as empresa_id,
    ec.nome as empresa_nome,
    COUNT(DISTINCT f.cpf) as total_funcionarios,
    COUNT(
        DISTINCT CASE
            WHEN f.nivel_cargo = 'operacional' THEN f.cpf
        END
    ) as funcionarios_operacionais,
    COUNT(
        DISTINCT CASE
            WHEN f.nivel_cargo = 'gestao' THEN f.cpf
        END
    ) as funcionarios_gestao,
    COUNT(a.id) as total_avaliacoes,
    COUNT(
        CASE
            WHEN a.status = 'concluida' THEN a.id
        END
    ) as avaliacoes_concluidas,
    COUNT(
        CASE
            WHEN a.status = 'em_andamento' THEN a.id
        END
    ) as avaliacoes_andamento,
    COUNT(
        CASE
            WHEN a.status = 'iniciada' THEN a.id
        END
    ) as avaliacoes_iniciadas,
    ROUND(
        (
            COUNT(
                CASE
                    WHEN a.status = 'concluida' THEN a.id
                END
            ) * 100.0 / NULLIF(COUNT(a.id), 0)
        ),
        2
    ) as percentual_conclusao
FROM
    funcionarios f
    LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id
    LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
WHERE
    f.perfil = 'funcionario'
GROUP BY
    f.clinica_id,
    ec.id,
    ec.nome
ORDER BY f.clinica_id, ec.nome;

-- 2. Criar função para obter resultados filtrados por empresa
CREATE OR REPLACE FUNCTION get_resultados_por_empresa(
    p_clinica_id INTEGER,
    p_empresa_id INTEGER DEFAULT NULL
) RETURNS TABLE(
    empresa_id INTEGER,
    empresa_nome VARCHAR,
    grupo INTEGER,
    dominio VARCHAR,
    media_score DECIMAL,
    categoria VARCHAR,
    total_respostas BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.id as empresa_id,
        ec.nome as empresa_nome,
        r.grupo,
        CASE r.grupo
            WHEN 1 THEN 'Demandas no Trabalho'
            WHEN 2 THEN 'Organização e Conteúdo'
            WHEN 3 THEN 'Relações Sociais'
            WHEN 4 THEN 'Liderança'
            WHEN 5 THEN 'Valores Organizacionais'
            WHEN 6 THEN 'Saúde e Bem-estar'
            WHEN 7 THEN 'Comportamentos Ofensivos'
            WHEN 8 THEN 'Jogos de Azar'
            WHEN 9 THEN 'Endividamento'
            ELSE 'Outros'
        END as dominio,
        AVG(r.valor) as media_score,
        CASE 
            WHEN AVG(r.valor) >= 75 THEN 'alto'
            WHEN AVG(r.valor) >= 50 THEN 'medio'
            ELSE 'baixo'
        END as categoria,
        COUNT(r.valor) as total_respostas
    FROM respostas r
    JOIN avaliacoes a ON r.avaliacao_id = a.id
    JOIN funcionarios f ON a.funcionario_cpf = f.cpf
    JOIN empresas_clientes ec ON f.empresa_id = ec.id
    WHERE f.clinica_id = p_clinica_id
        AND (p_empresa_id IS NULL OR ec.id = p_empresa_id)
        AND a.status = 'concluida'
    GROUP BY ec.id, ec.nome, r.grupo
    ORDER BY ec.nome, r.grupo;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar view para comparativo entre empresas
CREATE OR REPLACE VIEW vw_comparativo_empresas AS
SELECT
    ec.clinica_id,
    ec.id as empresa_id,
    ec.nome as empresa_nome,
    AVG(
        CASE
            WHEN r.grupo = 1 THEN r.valor
        END
    ) as demandas_trabalho,
    AVG(
        CASE
            WHEN r.grupo = 2 THEN r.valor
        END
    ) as organizacao_conteudo,
    AVG(
        CASE
            WHEN r.grupo = 3 THEN r.valor
        END
    ) as relacoes_sociais,
    AVG(
        CASE
            WHEN r.grupo = 4 THEN r.valor
        END
    ) as lideranca,
    AVG(
        CASE
            WHEN r.grupo = 5 THEN r.valor
        END
    ) as valores_organizacionais,
    AVG(
        CASE
            WHEN r.grupo = 6 THEN r.valor
        END
    ) as saude_bem_estar,
    -- Scores médios gerais
    AVG(r.valor) as score_geral,
    -- Contadores
    COUNT(DISTINCT f.cpf) as funcionarios_responderam,
    COUNT(r.valor) as total_respostas
FROM
    empresas_clientes ec
    JOIN funcionarios f ON ec.id = f.empresa_id
    JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
    JOIN respostas r ON a.id = r.avaliacao_id
WHERE
    a.status = 'concluida'
    AND r.grupo <= 6 -- Apenas grupos principais do COPSOQ
GROUP BY
    ec.clinica_id,
    ec.id,
    ec.nome
ORDER BY ec.clinica_id, ec.nome;

-- 4. Inserir dados de teste para múltiplas empresas
INSERT INTO
    empresas_clientes (
        nome,
        cnpj,
        endereco,
        telefone,
        email,
        clinica_id
    )
VALUES (
        'TechCorp Ltda',
        '11222333000144',
        'Av. Tecnologia, 500 - São Paulo/SP',
        '(11) 3000-4000',
        'contato@techcorp.com.br',
        1
    ),
    (
        'Industrial Brasil S.A.',
        '55666777000188',
        'Rod. Industrial, 1500 - Guarulhos/SP',
        '(11) 4000-5000',
        'rh@industrialbrasil.com.br',
        1
    ),
    (
        'Serviços Plus',
        '99888777000166',
        'Rua Comercial, 200 - Santos/SP',
        '(13) 2000-3000',
        'admin@servicosplus.com.br',
        1
    ) ON CONFLICT (cnpj) DO NOTHING;

-- 5. Verificar estrutura dos filtros
SELECT '=== DASHBOARD POR EMPRESA ===' as titulo;

SELECT * FROM vw_dashboard_por_empresa WHERE clinica_id = 1;

SELECT '=== EXEMPLO DE RESULTADOS FILTRADOS ===' as titulo;

SELECT * FROM get_resultados_por_empresa (1, NULL) LIMIT 5;

SELECT '=== COMPARATIVO ENTRE EMPRESAS ===' as titulo;

SELECT
    empresa_nome,
    ROUND(score_geral, 2) as score_medio,
    funcionarios_responderam,
    ROUND(demandas_trabalho, 2) as demandas,
    ROUND(organizacao_conteudo, 2) as organizacao,
    ROUND(saude_bem_estar, 2) as saude
FROM vw_comparativo_empresas
WHERE
    clinica_id = 1;

-- 6. Estatísticas de empresas por clínica
SELECT '=== ESTATÍSTICAS POR CLÍNICA ===' as titulo;

SELECT
    clinica_id,
    COUNT(DISTINCT empresa_id) as total_empresas,
    SUM(total_funcionarios) as total_funcionarios,
    SUM(total_avaliacoes) as total_avaliacoes,
    ROUND(AVG(percentual_conclusao), 2) as media_conclusao
FROM vw_dashboard_por_empresa
GROUP BY
    clinica_id;

SELECT '✅ ETAPA 13 CONCLUÍDA - FILTROS POR EMPRESA IMPLEMENTADOS!' as resultado;