-- Script corrigido para reverter o status dos lotes 004 (ID 4) e 005 (ID 5)
-- e seus respectivos laudos para que possam ter o laudo gerado novamente

-- Verificar status atual antes da alteração
SELECT 'STATUS ATUAL - LOTES' as tipo, la.id, la.codigo, la.titulo, la.status as lote_status, la.atualizado_em
FROM lotes_avaliacao la
WHERE
    la.id IN (4, 5)
UNION ALL
SELECT 'STATUS ATUAL - LAUDOS' as tipo, l.id, la.codigo, la.titulo, l.status as laudo_status, l.atualizado_em
FROM laudos l
    JOIN lotes_avaliacao la ON l.lote_id = la.id
WHERE
    la.id IN (4, 5);

-- Reverter o status dos lotes para 'finalizado' (permite emissão de laudo)
UPDATE lotes_avaliacao
SET
    status = 'finalizado',
    atualizado_em = NOW()
WHERE
    id IN (4, 5)
    AND status IN ('concluido', 'ativo');

-- Reverter o status dos laudos para 'rascunho' (permite re-emissão)
UPDATE laudos
SET
    status = 'rascunho',
    emitido_em = NULL,
    atualizado_em = NOW()
WHERE
    lote_id IN (4, 5)
    AND status IN ('emitido', 'enviado');

-- Verificar status após alteração
SELECT 'STATUS APÓS ALTERAÇÃO - LOTES' as tipo, la.id, la.codigo, la.titulo, la.status as lote_status, la.atualizado_em
FROM lotes_avaliacao la
WHERE
    la.id IN (4, 5)
UNION ALL
SELECT 'STATUS APÓS ALTERAÇÃO - LAUDOS' as tipo, l.id, la.codigo, la.titulo, l.status as laudo_status, l.atualizado_em
FROM laudos l
    JOIN lotes_avaliacao la ON l.lote_id = la.id
WHERE
    la.id IN (4, 5);

-- Mensagem de confirmação
SELECT '✅ Lote ' || la.codigo || ' (ID: ' || la.id || ') - Status lote: ' || la.status || ', Status laudo: ' || COALESCE(l.status, 'sem laudo') as resultado
FROM lotes_avaliacao la
    LEFT JOIN laudos l ON l.lote_id = la.id
WHERE
    la.id IN (4, 5);