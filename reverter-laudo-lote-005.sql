-- Script para reverter o status do laudo do lote 005 (ID 5 - 003/301125)
-- de 'emitido' para 'rascunho' no banco de produção

-- Status atual do lote 005
SELECT 'STATUS ATUAL - LOTE 005' as tipo, la.id, la.codigo, la.titulo, la.status as lote_status, la.atualizado_em
FROM lotes_avaliacao la
WHERE
    la.id = 5
UNION ALL
SELECT 'STATUS ATUAL - LAUDO 005' as tipo, l.id, la.codigo, la.titulo, l.status as laudo_status, l.emitido_em
FROM laudos l
    JOIN lotes_avaliacao la ON l.lote_id = la.id
WHERE
    la.id = 5;

-- Reverter laudo para status 'rascunho' (permite re-emissão)
UPDATE laudos
SET
    status = 'rascunho',
    emitido_em = NULL,
    atualizado_em = NOW()
WHERE
    lote_id = 5
    AND status = 'emitido';

-- Status após alteração
SELECT 'STATUS APÓS ALTERAÇÃO - LOTE 005' as tipo, la.id, la.codigo, la.titulo, la.status as lote_status, la.atualizado_em
FROM lotes_avaliacao la
WHERE
    la.id = 5
UNION ALL
SELECT 'STATUS APÓS ALTERAÇÃO - LAUDO 005' as tipo, l.id, la.codigo, la.titulo, l.status as laudo_status, l.atualizado_em
FROM laudos l
    JOIN lotes_avaliacao la ON l.lote_id = la.id
WHERE
    la.id = 5;

-- Confirmação
SELECT
    CASE
        WHEN l.status = 'rascunho' THEN '✅ Laudo do lote 005 (003/301125) revertido para rascunho com sucesso!'
        ELSE '❌ Falha ao reverter laudo do lote 005. Status atual: ' || l.status
    END as resultado
FROM lotes_avaliacao la
    LEFT JOIN laudos l ON l.lote_id = la.id
WHERE
    la.id = 5;