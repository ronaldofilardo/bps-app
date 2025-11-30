-- Script para reenviar o lote 001-301125 para o emissor gerar laudo
-- Este script marca o lote como finalizado se todas as avaliações estiverem concluídas

-- Primeiro, verificar se o lote existe e seu status atual
SELECT
    la.id,
    la.codigo,
    la.status,
    la.titulo,
    COUNT(a.id) as total_avaliacoes,
    COUNT(
        CASE
            WHEN a.status = 'concluida' THEN 1
        END
    ) as avaliacoes_concluidas,
    COUNT(
        CASE
            WHEN f.ativo = false THEN 1
        END
    ) as avaliacoes_inativas
FROM
    lotes_avaliacao la
    LEFT JOIN avaliacoes a ON la.id = a.lote_id
    LEFT JOIN funcionarios f ON a.funcionario_cpf = f.cpf
WHERE
    la.codigo = '001-301125'
GROUP BY
    la.id,
    la.codigo,
    la.status,
    la.titulo;

-- Se o lote existe e todas as avaliações estão concluídas (desconsiderando inativos),
-- marcar o lote como finalizado
UPDATE lotes_avaliacao
SET
    status = 'finalizado',
    finalizado_em = NOW(),
    atualizado_em = NOW()
WHERE
    codigo = '001-301125'
    AND status IN ('ativo', 'finalizado')
    AND id IN (
        SELECT la.id
        FROM
            lotes_avaliacao la
            LEFT JOIN avaliacoes a ON la.id = a.lote_id
            LEFT JOIN funcionarios f ON a.funcionario_cpf = f.cpf
        WHERE
            la.codigo = '001-301125'
        GROUP BY
            la.id
        HAVING
            COUNT(a.id) > 0
            AND COUNT(
                CASE
                    WHEN a.status = 'concluida' THEN 1
                END
            ) = (
                COUNT(a.id) - COUNT(
                    CASE
                        WHEN f.ativo = false THEN 1
                    END
                )
            )
    );

-- Verificar o resultado da atualização
SELECT
    la.id,
    la.codigo,
    la.status,
    la.finalizado_em,
    COUNT(a.id) as total_avaliacoes,
    COUNT(
        CASE
            WHEN a.status = 'concluida' THEN 1
        END
    ) as avaliacoes_concluidas
FROM
    lotes_avaliacao la
    LEFT JOIN avaliacoes a ON la.id = a.lote_id
WHERE
    la.codigo = '001-301125'
GROUP BY
    la.id,
    la.codigo,
    la.status,
    la.finalizado_em;

-- Mensagem de confirmação
SELECT
    CASE
        WHEN status = 'finalizado' THEN '✅ Lote 001-301125 marcado como finalizado e pronto para emissão de laudo!'
        ELSE '❌ Lote não pôde ser finalizado. Verifique se todas as avaliações estão concluídas.'
    END as resultado
FROM lotes_avaliacao
WHERE
    codigo = '001-301125';