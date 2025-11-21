-- Criando segunda clínica para testar multi-tenancy
-- Etapa 2: Teste de isolamento de dados

-- 1. Inserir segunda clínica
INSERT INTO
    clinicas (nome, cnpj, email, telefone)
VALUES (
        'Medicina do Trabalho ABC',
        '98765432000112',
        'contato@medtrababc.com.br',
        '(11) 88888-8888'
    );

-- 2. Criar administrador para a segunda clínica
-- CPF: 33333333333, senha: admin123
INSERT INTO
    funcionarios (
        cpf,
        nome,
        email,
        senha_hash,
        perfil,
        clinica_id
    )
VALUES (
        '33333333333',
        'Admin Clínica ABC',
        'admin@medtrababc.com.br',
        '$2a$10$ZinrjN3Je95XYcXunJNqGOn8Oa3FPPT.IOZzm9umupnVf41i4sr6m',
        'admin',
        2
    );

-- 3. Criar RH para a segunda clínica
-- CPF: 44444444444, senha: rh123
INSERT INTO
    funcionarios (
        cpf,
        nome,
        email,
        senha_hash,
        perfil,
        clinica_id
    )
VALUES (
        '44444444444',
        'RH Clínica ABC',
        'rh@medtrababc.com.br',
        '$2a$10$qFf73.uHvCCBGdBXS64LNeMsNXorsmRqfIyXFACTY733BlIRleOiy',
        'rh',
        2
    );

-- 4. Criar funcionário teste para a segunda clínica
-- CPF: 55555555555, senha: func123
INSERT INTO
    funcionarios (
        cpf,
        nome,
        email,
        senha_hash,
        perfil,
        clinica_id
    )
VALUES (
        '55555555555',
        'Funcionário ABC',
        'funcionario@medtrababc.com.br',
        '$2a$10$abc123hashfortesting.dummy.hash.here.teste123',
        'funcionario',
        2
    );

-- 5. Verificar estrutura multi-tenant
SELECT '=== CLÍNICAS CADASTRADAS ===' as titulo, id, nome, cnpj
FROM clinicas
ORDER BY id;

SELECT '=== FUNCIONÁRIOS POR CLÍNICA ===' as titulo, c.nome as clinica, f.cpf, f.nome, f.perfil
FROM funcionarios f
    LEFT JOIN clinicas c ON f.clinica_id = c.id
ORDER BY f.clinica_id, f.perfil, f.nome;

SELECT '✅ SEGUNDA CLÍNICA CRIADA - MULTI-TENANCY PRONTO PARA TESTE!' as resultado;