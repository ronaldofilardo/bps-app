-- Script para reverter lotes 004 e 005 para status 'rascunho' em ambos os bancos
-- Executar tanto no desenvolvimento quanto na produção

-- Status atual antes da alteração
SELECT 'STATUS ATUAL' as tipo, la.id, la.codigo, la.status as lote_status, l.status as laudo_status
FROM lotes_avaliacao la
LEFT JOIN laudos l ON l.lote_id = la.id
WHERE la.id IN (4, 5);

-- Reverter laudos para 'rascunho'
UPDATE laudos
SET status = 'rascunho', emitido_em = NULL, atualizado_em = NOW()
WHERE lote_id IN (4, 5) AND status = 'emitido';

-- Status após alteração
SELECT 'STATUS APÓS ALTERAÇÃO' as tipo, la.id, la.codigo, la.status as lote_status, l.status as laudo_status
FROM lotes_avaliacao la
LEFT JOIN laudos l ON l.lote_id = la.id
WHERE la.id IN (4, 5);

-- Confirmação
SELECT
    CASE
        WHEN l.status = 'rascunho'
        THEN '✅ Lote ' || la.codigo || ' revertido para rascunho com sucesso!'
        ELSE '❌ Falha ao reverter lote ' || la.codigo || '. Status atual: ' || COALESCE(l.status, 'sem laudo')
    END as resultado
FROM lotes_avaliacao la
LEFT JOIN laudos l ON l.lote_id = la.id
WHERE la.id IN (4, 5);