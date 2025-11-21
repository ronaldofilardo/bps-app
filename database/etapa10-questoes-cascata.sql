-- ETAPA 10: Questões em Cascata
-- Implementar lógica condicional baseada nas 70 questões específicas do COPSOQ-III

-- 1. Criar tabela para armazenar condições de questões
CREATE TABLE IF NOT EXISTS questao_condicoes (
    id SERIAL PRIMARY KEY,
    questao_id INTEGER NOT NULL, -- ID da questão (1-70)
    questao_dependente INTEGER, -- ID da questão que determina se esta deve aparecer
    operador VARCHAR(10), -- 'gt', 'lt', 'eq', 'gte', 'lte', 'ne'
    valor_condicao INTEGER, -- Valor para comparação
    categoria VARCHAR(20) DEFAULT 'core', -- 'core', 'behavioral', 'financial', 'health'
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inserir condições para questões comportamentais específicas
-- Questões de jogos de azar (59-64) só aparecem se Q59 > 0
INSERT INTO
    questao_condicoes (
        questao_id,
        questao_dependente,
        operador,
        valor_condicao,
        categoria
    )
VALUES (60, 59, 'gt', 0, 'behavioral'), -- Q60 só aparece se respondeu Q59 > Nunca
    (61, 59, 'gt', 0, 'behavioral'), -- Q61 só aparece se respondeu Q59 > Nunca
    (
        62,
        59,
        'gt',
        25,
        'behavioral'
    ), -- Q62 só aparece se Q59 >= Raramente
    (
        63,
        59,
        'gt',
        25,
        'behavioral'
    ), -- Q63 só aparece se Q59 >= Raramente
    (
        64,
        59,
        'gt',
        25,
        'behavioral'
    );
-- Q64 só aparece se Q59 >= Raramente

-- Questões de endividamento (65-70) só aparecem se Q65 > Raramente
INSERT INTO
    questao_condicoes (
        questao_id,
        questao_dependente,
        operador,
        valor_condicao,
        categoria
    )
VALUES (66, 65, 'gt', 25, 'financial'), -- Q66 só aparece se Q65 > Raramente
    (67, 65, 'gt', 50, 'financial'), -- Q67 só aparece se Q65 > Às vezes
    (68, 65, 'gt', 50, 'financial'), -- Q68 só aparece se Q65 > Às vezes
    (69, 65, 'gt', 25, 'financial'), -- Q69 só aparece se Q65 > Raramente
    (70, 65, 'gt', 75, 'financial');
-- Q70 só aparece se Q65 >= Muitas vezes

-- Questões de violência (57-58) só aparecem se Q56 > 0 OU stress alto
INSERT INTO
    questao_condicoes (
        questao_id,
        questao_dependente,
        operador,
        valor_condicao,
        categoria
    )
VALUES (57, 56, 'gt', 0, 'behavioral'), -- Q57 aparece se Q56 > Nunca
    (58, 56, 'gt', 0, 'behavioral');
-- Q58 aparece se Q56 > Nunca

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_questao_condicoes_questao ON questao_condicoes (questao_id);

CREATE INDEX IF NOT EXISTS idx_questao_condicoes_dependente ON questao_condicoes (questao_dependente);

-- 4. Verificar condições criadas
SELECT '=== CONDIÇÕES DE CASCATA CRIADAS ===' as titulo;

SELECT
    qc.questao_id,
    qc.questao_dependente,
    qc.operador,
    qc.valor_condicao,
    qc.categoria,
    CASE
        WHEN qc.questao_id BETWEEN 59 AND 64  THEN 'Jogos de Azar'
        WHEN qc.questao_id BETWEEN 65 AND 70  THEN 'Endividamento'
        WHEN qc.questao_id BETWEEN 57 AND 58  THEN 'Violência'
        ELSE 'Core'
    END as tema
FROM questao_condicoes qc
ORDER BY qc.questao_id;

SELECT '✅ ETAPA 10 CONCLUÍDA - QUESTÕES EM CASCATA IMPLEMENTADAS!' as resultado;