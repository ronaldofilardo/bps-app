-- Script para reverter o status do lote 004 (ID 4 - 002/02122025)
-- para permitir re-emissão de laudo no banco de produção

-- Status atual do lote 004
SELECT 'STATUS ATUAL - LOTE 004' as tipo, la.id, la.codigo, la.titulo, la.status as lote_status, la.atualizado_em
FROM lotes_avaliacao la
WHERE
    la.id = 4
UNION ALL
SELECT 'STATUS ATUAL - LAUDO 004' as tipo, l.id, la.codigo, la.titulo, l.status as laudo_status, l.atualizado_em
FROM laudos l
    JOIN lotes_avaliacao la ON l.lote_id = la.id
WHERE
    la.id = 4;

-- Reverter lote para status 'finalizado' (permite emissão de laudo)
UPDATE lotes_avaliacao
SET
    status = 'finalizado',
    atualizado_em = NOW()
WHERE
    id = 4
    AND status != 'finalizado';

-- Reverter laudo para status 'rascunho' (permite re-emissão)
UPDATE laudos
SET
    status = 'rascunho',
    emitido_em = NULL,
    atualizado_em = NOW()
WHERE
    lote_id = 4
    AND status != 'rascunho';

-- Status após alteração
SELECT 'STATUS APÓS ALTERAÇÃO - LOTE 004' as tipo, la.id, la.codigo, la.titulo, la.status as lote_status, la.atualizado_em
FROM lotes_avaliacao la
WHERE
    la.id = 4
UNION ALL
SELECT 'STATUS APÓS ALTERAÇÃO - LAUDO 004' as tipo, l.id, la.codigo, la.titulo, l.status as laudo_status, l.atualizado_em
FROM laudos l
    JOIN lotes_avaliacao la ON l.lote_id = la.id
WHERE
    la.id = 4;

-- Confirmação
SELECT
    CASE
        WHEN la.status = 'finalizado'
        AND l.status = 'rascunho' THEN '✅ Lote 004 (002/02122025) está pronto para re-emissão de laudo!'
        ELSE '❌ Lote 004 não pôde ser revertido completamente. Status atual - Lote: ' || la.status || ', Laudo: ' || COALESCE(l.status, 'sem laudo')
    END as resultado
FROM lotes_avaliacao la
    LEFT JOIN laudos l ON l.lote_id = la.id
WHERE
    la.id = 4;