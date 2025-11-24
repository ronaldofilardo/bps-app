

jest.mock('@/lib/db', () => ({
  query: jest.fn()
}));
jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn().mockResolvedValue({ cpf: '12345678900', nome: 'Teste', perfil: 'funcionario' })
}));
import { POST as finalizarAvaliacao } from '@/app/api/avaliacao/finalizar/route';
import { query as mockQuery } from '@/lib/db';
import { grupos } from '@/lib/questoes';

describe('API /api/avaliacao/finalizar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não permite finalizar se faltam respostas obrigatórias', async () => {
    (mockQuery as jest.Mock).mockReset();
    (mockQuery as jest.Mock)
      .mockImplementationOnce(async () => ({ rows: [{ id: 1 }], rowCount: 1 })) // Busca avaliação
      .mockImplementationOnce(async () => ({ rows: Array(10).fill({ grupo: 1, item: 'Q1', valor: 50 }), rowCount: 10 })); // Só 10 respostas

    const req = {
      method: 'POST',
      json: async () => ({})
    } as any;
    const res = await finalizarAvaliacao(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/não está completa/i);
  });

  it('permite finalizar se todas as respostas obrigatórias estão presentes', async () => {
    (mockQuery as jest.Mock).mockReset();
    (mockQuery as jest.Mock)
      .mockImplementationOnce(async () => ({ rows: [{ id: 1 }], rowCount: 1 })) // Busca avaliação
      .mockImplementationOnce(async () => ({
        rows: grupos.flatMap(grupo => grupo.itens.map(item => ({ grupo: grupo.id, item: item.id, valor: 50 }))),
        rowCount: grupos.reduce((acc, g) => acc + g.itens.length, 0)
      }))
      .mockImplementation(async () => ({ rows: [], rowCount: 0 })); // Para inserts/updates

    const req = {
      method: 'POST',
      json: async () => ({})
    } as any;
    const res = await finalizarAvaliacao(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });
});
