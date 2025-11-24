-- Adicionar constraint UNIQUE se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'respostas_avaliacao_id_grupo_item_key'
        AND conrelid = 'respostas'::regclass
    ) THEN
        ALTER TABLE respostas ADD CONSTRAINT respostas_avaliacao_id_grupo_item_key UNIQUE (avaliacao_id, grupo, item);
    END IF;
END $$;