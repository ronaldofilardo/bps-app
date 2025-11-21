-- BPS Brasil - Schema SQL v2 - Master Admin & Clínicas
-- Compatível com Neon PostgreSQL e PostgreSQL Local
-- Etapa 1: Criação do Master Admin

-- Tabela de Clínicas (Multi-tenant)
CREATE TABLE IF NOT EXISTS clinicas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnpj CHAR(14) UNIQUE,
    email VARCHAR(100),
    telefone VARCHAR(20),
    endereco TEXT,
    ativa BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Funcionários (atualizada com perfil master)
CREATE TABLE IF NOT EXISTS funcionarios (
    id SERIAL PRIMARY KEY,
    cpf CHAR(11) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    setor VARCHAR(50),
    funcao VARCHAR(50),
    email VARCHAR(100),
    senha_hash TEXT NOT NULL,
    perfil VARCHAR(20) DEFAULT 'funcionario' CHECK (
        perfil IN (
            'funcionario',
            'rh',
            'admin',
            'master'
        )
    ),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Avaliações
CREATE TABLE IF NOT EXISTS avaliacoes (
    id SERIAL PRIMARY KEY,
    funcionario_cpf CHAR(11) NOT NULL REFERENCES funcionarios (cpf) ON DELETE CASCADE,
    inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    envio TIMESTAMP,
    status VARCHAR(20) DEFAULT 'iniciada' CHECK (
        status IN (
            'iniciada',
            'em_andamento',
            'concluida'
        )
    ),
    grupo_atual INT DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Respostas
CREATE TABLE IF NOT EXISTS respostas (
    id SERIAL PRIMARY KEY,
    avaliacao_id INT NOT NULL REFERENCES avaliacoes (id) ON DELETE CASCADE,
    grupo INT NOT NULL,
    item VARCHAR(10) NOT NULL,
    valor INT NOT NULL CHECK (valor IN (0, 25, 50, 75, 100)),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT respostas_avaliacao_id_grupo_item_key UNIQUE (avaliacao_id, grupo, item)
);

-- Tabela de Resultados (scores calculados)
CREATE TABLE IF NOT EXISTS resultados (
    id SERIAL PRIMARY KEY,
    avaliacao_id INT NOT NULL REFERENCES avaliacoes (id) ON DELETE CASCADE,
    grupo INT NOT NULL,
    dominio VARCHAR(100) NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    categoria VARCHAR(20) CHECK (
        categoria IN ('baixo', 'medio', 'alto')
    ),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT resultados_avaliacao_id_grupo_key UNIQUE (avaliacao_id, grupo)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_avaliacoes_funcionario ON avaliacoes (funcionario_cpf);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_status ON avaliacoes (status);

CREATE INDEX IF NOT EXISTS idx_respostas_avaliacao ON respostas (avaliacao_id);

CREATE INDEX IF NOT EXISTS idx_resultados_avaliacao ON resultados (avaliacao_id);

-- SEED: Inserir clínica padrão
INSERT INTO
    clinicas (nome, cnpj, email)
VALUES (
        'BPS Brasil - Clínica Padrão',
        '12345678000195',
        'contato@bpsbrasil.com.br'
    ) ON CONFLICT DO NOTHING;

-- SEED: Inserir usuário Master Admin (CPF: 00000000000, senha: master123)
INSERT INTO
    funcionarios (
        cpf,
        nome,
        email,
        senha_hash,
        perfil
    )
VALUES (
        '00000000000',
        'Master Administrador',
        'master@bpsbrasil.com.br',
        '$2a$10$Z3QK5YrKGQJN5yXZ9K5yXOK5YrKGQJN5yXZ9K5yXOK5YrKGQJN5yX',
        'master'
    ) ON CONFLICT (cpf) DO
UPDATE
SET
    perfil = 'master',
    nome = 'Master Administrador',
    email = 'master@bpsbrasil.com.br';

-- SEED: Inserir usuário admin padrão (senha: admin123)
INSERT INTO
    funcionarios (
        cpf,
        nome,
        email,
        senha_hash,
        perfil
    )
VALUES (
        '11111111111',
        'Administrador Clínica',
        'admin@bps.com.br',
        '$2a$10$Z3QK5YrKGQJN5yXZ9K5yXOK5YrKGQJN5yXZ9K5yXOK5YrKGQJN5yX',
        'admin'
    ) ON CONFLICT (cpf) DO NOTHING;

-- SEED: Inserir usuário RH padrão (senha: rh123)
INSERT INTO
    funcionarios (
        cpf,
        nome,
        email,
        senha_hash,
        perfil
    )
VALUES (
        '22222222222',
        'RH Gestor',
        'rh@bps.com.br',
        '$2a$10$H3QK5YrKGQJN5yXZ9K5yXOK5YrKGQJN5yXZ9K5yXOK5YrKGQJN5yH',
        'rh'
    ) ON CONFLICT (cpf) DO NOTHING;