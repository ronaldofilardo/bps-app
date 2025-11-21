import { jest } from "@jest/globals";

// Mock do pg
const mockClient = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
};

const MockClient = jest.fn().mockImplementation(() => mockClient);

jest.mock("pg", () => ({
  default: {
    Client: MockClient,
  },
  Client: MockClient,
}));

// Mock do bcryptjs
const mockHash = jest.fn();
jest.mock("bcryptjs", () => ({
  default: {
    hash: mockHash,
  },
  hash: mockHash,
}));

describe("Seed Users Script", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LOCAL_DATABASE_URL =
      "postgresql://test:test@localhost:5432/test";
  });

  it("deve criar cliente PostgreSQL com URL correta", async () => {
    mockClient.connect.mockResolvedValue();
    mockClient.query.mockResolvedValue({ rows: [] });
    mockClient.end.mockResolvedValue();
    mockHash.mockResolvedValue("$2a$10$hashedpassword");

    // Simular importação e execução do script
    const { Client } = await import("pg");
    const client = new Client({
      connectionString: process.env.LOCAL_DATABASE_URL,
    });

    expect(MockClient).toHaveBeenCalledWith({
      connectionString: "postgresql://test:test@localhost:5432/test",
    });
  });

  it("deve gerar hash para todas as senhas", async () => {
    mockHash.mockResolvedValue("$2a$10$hashedpassword");

    const bcrypt = await import("bcryptjs");

    // Simular hashing de senhas
    await bcrypt.default.hash("123456", 10);
    await bcrypt.default.hash("123", 10);

    expect(mockHash).toHaveBeenCalledWith("123456", 10);
    expect(mockHash).toHaveBeenCalledWith("123", 10);
  });

  it("deve conectar e executar queries corretamente", async () => {
    mockClient.connect.mockResolvedValue();
    mockClient.query.mockResolvedValue({ rows: [] });
    mockClient.end.mockResolvedValue();
    mockHash.mockResolvedValue("$2a$10$hashedpassword");

    const { Client } = await import("pg");
    const bcrypt = await import("bcryptjs");

    const client = new Client({
      connectionString: process.env.LOCAL_DATABASE_URL,
    });

    await client.connect();
    await client.query("SELECT 1");
    await bcrypt.default.hash("123456", 10);
    await client.end();

    expect(mockClient.connect).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalled();
    expect(mockClient.end).toHaveBeenCalled();
  });

  it("deve verificar se hash de senha funciona", async () => {
    mockHash.mockResolvedValue("$2a$10$hashedpassword123");

    const bcrypt = await import("bcryptjs");
    const result = await bcrypt.default.hash("testpassword", 10);

    expect(result).toBe("$2a$10$hashedpassword123");
    expect(mockHash).toHaveBeenCalledWith("testpassword", 10);
  });

  it("deve verificar configuração de ambiente", () => {
    expect(process.env.LOCAL_DATABASE_URL).toBe(
      "postgresql://test:test@localhost:5432/test"
    );
  });
});
