import bcrypt from "bcryptjs";
import pg from "pg";

const { Client } = pg;

// Configuração da conexão com o banco
const connectionString =
  process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;
console.log("Connection string:", connectionString);
console.log("NODE_ENV:", process.env.NODE_ENV);
const client = new Client({
  connectionString,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function seedUsers() {
  try {
    await client.connect();
    console.log("Conectado ao banco de dados");

    // Verificar se clínica existe, senão criar
    const clinicaResult = await client.query(
      "SELECT id FROM clinicas WHERE id = 1"
    );
    if (clinicaResult.rows.length === 0) {
      await client.query(`
        INSERT INTO clinicas (nome, cnpj, email)
        VALUES ('BPS Brasil - Clínica Padrão', '12345678000195', 'contato@bpsbrasil.com.br')
        ON CONFLICT DO NOTHING
      `);
      console.log("Clínica padrão criada");
    }

    // Verificar se empresa existe, senão criar
    const empresaResult = await client.query(
      "SELECT id FROM empresas_clientes WHERE id = 1"
    );
    if (empresaResult.rows.length === 0) {
      await client.query(`
        INSERT INTO empresas_clientes (nome, cnpj, email, clinica_id)
        VALUES ('Indústria Metalúrgica São Paulo', '11222333000144', 'contato@metalurgicasp.com.br', 1)
        ON CONFLICT DO NOTHING
      `);
      console.log("Empresa teste criada");
    }

    // Dados dos usuários
    const users = [
      {
        cpf: "00000000000",
        nome: "Admin",
        email: "admin@bps.com.br",
        senha: "123456",
        perfil: "master",
        clinica_id: null,
        empresa_id: null,
        matricula: null,
        nivel_cargo: null,
        turno: null,
        escala: null,
        setor: "Administracao",
        funcao: "Administrador do Sistema",
      },
      {
        cpf: "11111111111",
        nome: "Gestor RH",
        email: "gestor@bps.com.br",
        senha: "123",
        perfil: "rh",
        clinica_id: 1,
        empresa_id: null,
        matricula: null,
        nivel_cargo: null,
        turno: null,
        escala: null,
        setor: "Recursos Humanos",
        funcao: "Gestor de RH",
      },
      {
        cpf: "22222222222",
        nome: "João Operacional Silva",
        email: "oper01@empresa.com.br",
        senha: "123",
        perfil: "funcionario",
        clinica_id: 1,
        empresa_id: 1,
        matricula: "MAT001",
        nivel_cargo: "operacional",
        turno: "Manhã",
        escala: "8x40",
        setor: "Produção",
        funcao: "Operador de Máquinas",
      },
      {
        cpf: "33333333333",
        nome: "Maria Gestão Santos",
        email: "gestao01@empresa.com.br",
        senha: "123",
        perfil: "funcionario",
        clinica_id: 1,
        empresa_id: 1,
        matricula: "MAT002",
        nivel_cargo: "gestao",
        turno: "Comercial",
        escala: "8x44",
        setor: "Gerência",
        funcao: "Gerente de Produção",
      },
    ];

    // Inserir usuários
    for (const user of users) {
      const senha_hash = await hashPassword(user.senha);

      const query = `
        INSERT INTO funcionarios (
          cpf, nome, email, senha_hash, perfil, clinica_id, empresa_id,
          matricula, nivel_cargo, turno, escala, setor, funcao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (cpf) DO UPDATE SET
          nome = EXCLUDED.nome,
          email = EXCLUDED.email,
          senha_hash = EXCLUDED.senha_hash,
          perfil = EXCLUDED.perfil,
          clinica_id = EXCLUDED.clinica_id,
          empresa_id = EXCLUDED.empresa_id,
          matricula = EXCLUDED.matricula,
          nivel_cargo = EXCLUDED.nivel_cargo,
          turno = EXCLUDED.turno,
          escala = EXCLUDED.escala,
          setor = EXCLUDED.setor,
          funcao = EXCLUDED.funcao,
          atualizado_em = CURRENT_TIMESTAMP
      `;

      const values = [
        user.cpf,
        user.nome,
        user.email,
        senha_hash,
        user.perfil,
        user.clinica_id,
        user.empresa_id,
        user.matricula,
        user.nivel_cargo,
        user.turno,
        user.escala,
        user.setor,
        user.funcao,
      ];

      await client.query(query, values);
      console.log(`Usuário ${user.nome} (${user.cpf}) inserido/atualizado`);
    }

    console.log("Seed concluído com sucesso!");

    // Verificar usuários inseridos
    const result = await client.query(`
      SELECT cpf, nome, perfil, clinica_id, empresa_id, nivel_cargo
      FROM funcionarios
      ORDER BY perfil, cpf
    `);

    console.log("\nUsuários no banco:");
    result.rows.forEach((user) => {
      console.log(
        `${user.cpf} - ${user.nome} (${user.perfil}) - Clinica: ${user.clinica_id} - Empresa: ${user.empresa_id} - Nivel: ${user.nivel_cargo}`
      );
    });
  } catch (error) {
    console.error("Erro durante o seed:", error);
  } finally {
    await client.end();
    console.log("Conexão fechada");
  }
}

// Executar seed
seedUsers();
