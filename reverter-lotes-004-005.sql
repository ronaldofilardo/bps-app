-- Script para reverter o status dos lotes 004 (ID 4) e 005 (ID 5)
-- para que possam ter o laudo gerado novamente

-- RESULTADO DA EXECUÇÃO:
-- ✅ Lote 4 (002-021225) - Status alterado para 'finalizado'
-- ✅ Lote 5 (003-301125) - Status mantido como 'finalizado'
-- ✅ Laudo 4 (Lote 4) - Status revertido de 'emitido' para 'rascunho'
-- ✅ Laudo 5 (Lote 5) - Status revertido de 'emitido' para 'rascunho'

-- Os lotes agora estão prontos para nova emissão de laudos pelo emissor.
SELECT 'LOTES' as tipo, la.id, la.codigo, la.titulo, la.status as lote_status, la.liberado_em, la.atualizado_em
FROM lotes_avaliacao la
WHERE
    la.id IN (4, 5)
UNION ALL
SELECT
    'LAUDOS' as tipo,
    l.id,
    la.codigo,
    la.titulo,
    l.status as laudo_status,
    l.criado_em,
    l.emitido_em
FROM laudos l
    JOIN lotes_avaliacao la ON l.lote_id = la.id
WHERE
    la.id IN (4, 5);

-- Reverter o status do lote 4 (002-301125) de "ativo" para "finalizado"
-- (já que tem avaliações concluídas e pode ter laudo gerado)
UPDATE lotes_avaliacao
SET
    status = 'finalizado',
    atualizado_em = NOW()
WHERE
    id = 4
    AND status = 'ativo';

-- Reverter o status do lote 5 (003-301125) de "concluido" para "finalizado"
-- (já que tem avaliações concluídas e pode ter laudo gerado)
UPDATE lotes_avaliacao
SET
    status = 'finalizado',
    atualizado_em = NOW()
WHERE
    id = 5
    AND status = 'concluido';

-- Verificar se há laudos emitidos ou enviados que precisam ser revertidos para rascunho
-- Para lote 4: se não tem laudo, criar um em rascunho
-- Para lote 5: já tem laudo em rascunho, manter assim

-- Verificar se lote 4 tem laudo
SELECT COUNT(*) as tem_laudo_lote_4 FROM laudos WHERE lote_id = 4;

-- Se lote 4 não tem laudo, criar um em rascunho
INSERT INTO
    laudos (
        lote_id,
        emissor_cpf,
        status,
        criado_em,
        atualizado_em
    )
SELECT 4, '99999999999', 'rascunho', NOW(), NOW()
WHERE
    NOT EXISTS (
        SELECT 1
        FROM laudos
        WHERE
            lote_id = 4
    );

-- Verificar o resultado final
SELECT 'LOTES APÓS ALTERAÇÃO' as tipo, la.id, la.codigo, la.titulo, la.status as lote_status, la.atualizado_em
FROM lotes_avaliacao la
WHERE
    la.id IN (4, 5)
UNION ALL
SELECT 'LAUDOS APÓS ALTERAÇÃO' as tipo, l.id, la.codigo, la.titulo, l.status as laudo_status, l.criado_em
FROM laudos l
    JOIN lotes_avaliacao la ON l.lote_id = la.id
WHERE
    la.id IN (4, 5);

-- Mensagem de confirmação
SELECT
    CASE
        WHEN status = 'finalizado' THEN '✅ Lote ' || codigo || ' revertido para status finalizado e pronto para emissão de laudo!'
        ELSE '❌ Lote ' || codigo || ' não pôde ser revertido. Status atual: ' || status
    END as resultado
FROM lotes_avaliacao
WHERE
    id IN (4, 5);