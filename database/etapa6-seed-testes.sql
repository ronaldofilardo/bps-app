-- ETAPA 6: Seed funcionários teste
-- Criar 2 funcionários específicos: CPF 87545772900 (Operacional) e 87545772901 (Gestão)

-- 1. Funcionário Operacional - CPF 87545772900
INSERT INTO
    funcionarios (
        cpf,
        nome,
        setor,
        funcao,
        email,
        senha_hash,
        perfil,
        clinica_id,
        empresa_id,
        matricula,
        nivel_cargo,
        turno,
        escala
    )
VALUES (
        '87545772900',
        'Roberto Operacional Silva',
        'Produção',
        'Operador Industrial',
        'roberto.operacional@teste.com.br',
        '$2a$10$0PO1.5NFcfpLMzfX99BOsOrxmlpe24Bxo.oIV7l1JsGtRByWSLH0e',
        'funcionario',
        1, -- BPS Brasil
        1, -- Indústria Metalúrgica São Paulo
        'MAT875457729',
        'operacional',
        'Manhã',
        '8x40'
    );

-- 2. Funcionário Gestão - CPF 87545772901
INSERT INTO
    funcionarios (
        cpf,
        nome,
        setor,
        funcao,
        email,
        senha_hash,
        perfil,
        clinica_id,
        empresa_id,
        matricula,
        nivel_cargo,
        turno,
        escala
    )
VALUES (
        '87545772901',
        'Fernanda Gestão Santos',
        'Gerência',
        'Supervisora de Produção',
        'fernanda.gestao@teste.com.br',
        '$2a$10$0PO1.5NFcfpLMzfX99BOsOrxmlpe24Bxo.oIV7l1JsGtRByWSLH0e',
        'funcionario',
        1, -- BPS Brasil
        1, -- Indústria Metalúrgica São Paulo
        'MAT875457730',
        'gestao',
        'Comercial',
        '8x44'
    );

-- 3. Verificar funcionários criados
SELECT '=== FUNCIONÁRIOS TESTE ESPECÍFICOS ===' as titulo;

SELECT f.cpf, f.nome, f.matricula, f.nivel_cargo, f.setor, f.funcao, ec.nome as empresa, f.turno, f.escala
FROM
    funcionarios f
    LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id
WHERE
    f.cpf IN ('87545772900', '87545772901')
ORDER BY f.cpf;

SELECT '✅ ETAPA 6 CONCLUÍDA - FUNCIONÁRIOS TESTE ESPECÍFICOS CRIADOS!' as resultado;