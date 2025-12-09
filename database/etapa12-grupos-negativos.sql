-- ETAPA 12: Tratamento para grupos com pontuação negativa
-- Implementar análise estatística avançada e detecção de anomalias

-- 1. Criar tabela para armazenar análises estatísticas
CREATE TABLE IF NOT EXISTS analise_estatistica (
    id SERIAL PRIMARY KEY,
    avaliacao_id INTEGER,
    grupo INTEGER,
    score_original DECIMAL(5, 2),
    score_ajustado DECIMAL(5, 2),
    anomalia_detectada BOOLEAN DEFAULT false,
    tipo_anomalia VARCHAR(100),
    recomendacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar função para detectar anomalias
CREATE OR REPLACE FUNCTION detectar_anomalia_score(
    p_score DECIMAL,
    p_tipo VARCHAR,
    p_grupo INTEGER
) RETURNS TABLE(
    is_anomalous BOOLEAN,
    reason TEXT,
    adjusted_score DECIMAL
) AS $$
BEGIN
    -- Scores fora do range válido (0-100)
    IF p_score < 0 OR p_score > 100 THEN
        RETURN QUERY SELECT true, 'Score fora do intervalo válido', GREATEST(0, LEAST(100, p_score));
        RETURN;
    END IF;
    
    -- Scores negativos em escalas positivas
    IF p_score < 0 AND p_tipo = 'positiva' THEN
        RETURN QUERY SELECT true, 'Score negativo em escala positiva', 0::DECIMAL;
        RETURN;
    END IF;
    
    -- Padrões suspeitos (todas respostas iguais)
    IF p_score IN (0, 25, 50, 75, 100) THEN
        RETURN QUERY SELECT true, 'Possível padrão de resposta uniforme', p_score;
        RETURN;
    END IF;
    
    -- Grupos específicos
    IF p_grupo = 8 AND p_score > 0 THEN
        RETURN QUERY SELECT true, 'Comportamentos ofensivos detectados', GREATEST(p_score, 25);
        RETURN;
    END IF;
    
    -- Score normal
    RETURN QUERY SELECT false, 'Score normal'::TEXT, p_score;
END;
$$ LANGUAGE plpgsql;

-- 3. Inserir dados de teste para análise
INSERT INTO
    analise_estatistica (
        avaliacao_id,
        grupo,
        score_original,
        score_ajustado,
        anomalia_detectada,
        tipo_anomalia,
        recomendacao
    )
VALUES (
        1,
        1,
        85.5,
        85.5,
        false,
        null,
        'Score normal para demandas'
    ),
    (
        1,
        2,
        -5.0,
        0.0,
        true,
        'Score negativo em escala positiva',
        'Revisar respostas - possível erro'
    ),
    (
        1,
        8,
        15.0,
        25.0,
        true,
        'Comportamentos ofensivos detectados',
        'Investigar casos reportados'
    ),
    (
        1,
        9,
        75.0,
        75.0,
        true,
        'Alto risco de Jogos de Apostas',
        'Oferecer suporte especializado'
    ),
    (
        2,
        1,
        0.0,
        15.0,
        true,
        'Possível subreporte',
        'Verificar veracidade das respostas'
    ),
    (
        2,
        3,
        120.0,
        100.0,
        true,
        'Score acima do máximo',
        'Revisar cálculo'
    ),
    (
        3,
        5,
        50.0,
        50.0,
        true,
        'Padrão uniforme de respostas',
        'Possível resposta automática'
    );

-- 4. Criar view para análise estatística
CREATE OR REPLACE VIEW vw_analise_grupos_negativos AS
SELECT
    grupo,
    COUNT(*) as total_avaliacoes,
    AVG(score_original) as media_original,
    AVG(score_ajustado) as media_ajustada,
    STDDEV(score_original) as desvio_padrao,
    COUNT(
        CASE
            WHEN anomalia_detectada THEN 1
        END
    ) as anomalias_detectadas,
    COUNT(
        CASE
            WHEN score_original < 0 THEN 1
        END
    ) as scores_negativos,
    COUNT(
        CASE
            WHEN score_original > 100 THEN 1
        END
    ) as scores_acima_limite,
    STRING_AGG (DISTINCT tipo_anomalia, ', ') as tipos_anomalias
FROM analise_estatistica
GROUP BY
    grupo
ORDER BY grupo;

-- 5. Verificar resultados da análise
SELECT '=== ANÁLISE DE GRUPOS NEGATIVOS ===' as titulo;

SELECT * FROM vw_analise_grupos_negativos;

SELECT '=== ANOMALIAS DETECTADAS ===' as titulo;

SELECT ae.grupo, ae.score_original, ae.score_ajustado, ae.tipo_anomalia, ae.recomendacao
FROM analise_estatistica ae
WHERE
    ae.anomalia_detectada = true
ORDER BY ae.grupo, ae.score_original;

-- 6. Estatísticas gerais
SELECT '=== ESTATÍSTICAS GERAIS ===' as titulo;

SELECT 'Total de avaliações' as metrica, COUNT(*) as valor
FROM analise_estatistica
UNION ALL
SELECT 'Anomalias detectadas' as metrica, COUNT(*) as valor
FROM analise_estatistica
WHERE
    anomalia_detectada = true
UNION ALL
SELECT 'Taxa de anomalias (%)' as metrica, ROUND(
        (
            COUNT(
                CASE
                    WHEN anomalia_detectada THEN 1
                END
            ) * 100.0 / COUNT(*)
        ), 2
    ) as valor
FROM analise_estatistica;

SELECT '✅ ETAPA 12 CONCLUÍDA - TRATAMENTO DE GRUPOS NEGATIVOS IMPLEMENTADO!' as resultado;