// Dados dos grupos de avaliação COPSOQ III + JZ + EF

export interface QuestionItem {
  id: string
  texto: string
  invertida?: boolean // Para cálculo de score (alguns itens são negativos)
}

export interface GrupoAvaliacao {
  id: number
  titulo: string
  dominio: string
  descricao: string
  itens: QuestionItem[]
  tipo: 'positiva' | 'negativa' | 'mista'
}

export const grupos: GrupoAvaliacao[] = [
  {
    id: 1,
    titulo: 'Grupo 1 - Demandas no Trabalho',
    dominio: 'Demandas no Trabalho',
    descricao: 'Avaliação das exigências quantitativas e ritmo de trabalho',
    tipo: 'negativa',
    itens: [
      { id: 'Q1', texto: 'Com que frequência você tem muito trabalho a fazer?' },
      { id: 'Q2', texto: 'Com que frequência você não tem tempo de completar todas as suas tarefas?' },
      { id: 'Q3', texto: 'Com que frequência você precisa trabalhar em ritmo acelerado?' },
      { id: 'Q4', texto: 'Com que frequência seu trabalho exige que você trabalhe muito rápido?' },
      { id: 'Q5', texto: 'Com que frequência você fica para trás com seu trabalho?' },
      { id: 'Q6', texto: 'Com que frequência você tem tempo suficiente para suas tarefas?', invertida: true },
      { id: 'Q7', texto: 'Com que frequência seu trabalho exige atenção constante?' },
      { id: 'Q8', texto: 'Com que frequência seu trabalho te deixa emocionalmente esgotado?' },
      { id: 'Q9', texto: 'Com que frequência seu trabalho te deixa fisicamente cansado?' },
      { id: 'Q10', texto: 'Com que frequência você precisa esconder seus sentimentos?' },
      { id: 'Q11', texto: 'Com que frequência você lida com situações emocionalmente difíceis?' },
    ]
  },
  {
    id: 2,
    titulo: 'Grupo 2 - Organização e Conteúdo',
    dominio: 'Organização e Conteúdo do Trabalho',
    descricao: 'Influência, desenvolvimento de habilidades e significado do trabalho',
    tipo: 'positiva',
    itens: [
      { id: 'Q12', texto: 'Você pode influenciar a quantidade de trabalho que te é atribuída?' },
      { id: 'Q13', texto: 'Você pode influenciar o que você faz no trabalho?' },
      { id: 'Q14', texto: 'Você tem alguma influência sobre como você faz seu trabalho?' },
      { id: 'Q15', texto: 'Seu trabalho exige que você tome iniciativa?' },
      { id: 'Q16', texto: 'Você pode usar suas habilidades ou expertise em seu trabalho?' },
      { id: 'Q17', texto: 'Você tem oportunidades de desenvolvimento pessoal em seu trabalho?' },
      { id: 'Q18', texto: 'Seu trabalho é significativo?' },
      { id: 'Q19', texto: 'Você sente que o trabalho que você faz é importante?' },
    ]
  },
  {
    id: 3,
    titulo: 'Grupo 3 - Relações Interpessoais',
    dominio: 'Relações Sociais e Liderança',
    descricao: 'Apoio social, feedback e reconhecimento no trabalho',
    tipo: 'positiva',
    itens: [
      { id: 'Q20', texto: 'Com que frequência você recebe ajuda e apoio de seus colegas?' },
      { id: 'Q21', texto: 'Com que frequência seus colegas estão dispostos a ouvir seus problemas de trabalho?' },
      { id: 'Q22', texto: 'Com que frequência você recebe ajuda e apoio de seu superior imediato?' },
      { id: 'Q23', texto: 'Seu superior imediato dá prioridade à satisfação no trabalho?' },
      { id: 'Q24', texto: 'Seu superior imediato é bom em planejamento do trabalho?' },
      { id: 'Q25', texto: 'Seu superior imediato é bom em resolver conflitos?' },
      { id: 'Q26', texto: 'Você recebe reconhecimento pelo seu esforço no trabalho?' },
      { id: 'Q27', texto: 'Você recebe feedback sobre seu trabalho?' },
      { id: 'Q28', texto: 'Seu trabalho é respeitado por seus colegas e superiores?' },
    ]
  },
  {
    id: 4,
    titulo: 'Grupo 4 - Interface Trabalho-Indivíduo',
    dominio: 'Interface Trabalho-Indivíduo',
    descricao: 'Insegurança no trabalho e conflito trabalho-família',
    tipo: 'mista',
    itens: [
      { id: 'Q29', texto: 'Você está preocupado em se tornar desempregado?' },
      { id: 'Q30', texto: 'Você está preocupado que mudanças no trabalho dificultem sua situação?' },
      { id: 'Q31', texto: 'Você está preocupado em ser transferido contra sua vontade?' },
      { id: 'Q32', texto: 'Você tem energia suficiente para família e amigos durante o tempo livre?', invertida: true },
      { id: 'Q33', texto: 'Seu trabalho toma tempo que você gostaria de passar com família/amigos?' },
      { id: 'Q34', texto: 'Você sente que seu trabalho prejudica sua vida privada?' },
    ]
  },
  {
    id: 5,
    titulo: 'Grupo 5 - Valores no Trabalho',
    dominio: 'Valores Organizacionais',
    descricao: 'Confiança, justiça e respeito mútuo na organização',
    tipo: 'positiva',
    itens: [
      { id: 'Q35', texto: 'Os funcionários ocultam informações uns dos outros?', invertida: true },
      { id: 'Q36', texto: 'Os funcionários ocultam informações da gerência?', invertida: true },
      { id: 'Q37', texto: 'A gerência confia nos funcionários para fazer bem seu trabalho?' },
      { id: 'Q38', texto: 'Os funcionários confiam na informação que vem da gerência?' },
      { id: 'Q39', texto: 'Os conflitos são resolvidos de forma justa?' },
      { id: 'Q40', texto: 'O trabalho é distribuído de forma justa?' },
      { id: 'Q41', texto: 'Os funcionários são valorizados quando fazem um bom trabalho?' },
      { id: 'Q42', texto: 'Todos os funcionários são tratados de forma justa?' },
    ]
  },
  {
    id: 6,
    titulo: 'Grupo 6 - Personalidade (Opcional)',
    dominio: 'Traços de Personalidade',
    descricao: 'Autoeficácia e autoconfiança',
    tipo: 'positiva',
    itens: [
      { id: 'Q43', texto: 'Eu sempre consigo resolver problemas difíceis se eu tentar o suficiente' },
      { id: 'Q44', texto: 'Se alguém se opõe, eu posso encontrar meios de conseguir o que quero' },
      { id: 'Q45', texto: 'É fácil para mim manter minhas metas e atingir meus objetivos' },
      { id: 'Q46', texto: 'Eu estou confiante que posso lidar eficientemente com eventos inesperados' },
      { id: 'Q47', texto: 'Eu posso me manter calmo enfrentando dificuldades porque confio em minhas habilidades' },
    ]
  },
  {
    id: 7,
    titulo: 'Grupo 7 - Saúde e Bem-Estar',
    dominio: 'Saúde e Bem-Estar',
    descricao: 'Avaliação de estresse, burnout e sintomas somáticos',
    tipo: 'negativa',
    itens: [
      { id: 'Q48', texto: 'Com que frequência você se sentiu estressado?' },
      { id: 'Q49', texto: 'Com que frequência você se sentiu irritável ou tenso?' },
      { id: 'Q50', texto: 'Com que frequência você teve dificuldade para relaxar?' },
      { id: 'Q51', texto: 'Com que frequência você se sentiu cansado?' },
      { id: 'Q52', texto: 'Com que frequência você teve problemas para dormir?' },
      { id: 'Q53', texto: 'Com que frequência você teve dores de cabeça?' },
      { id: 'Q54', texto: 'Com que frequência você teve dores musculares?' },
      { id: 'Q55', texto: 'Com que frequência você sentiu que não consegue continuar?' },
    ]
  },
  {
    id: 8,
    titulo: 'Grupo 8 - Comportamentos Ofensivos',
    dominio: 'Comportamentos Ofensivos',
    descricao: 'Exposição a assédio e violência no trabalho',
    tipo: 'negativa',
    itens: [
      { id: 'Q56', texto: 'Você foi submetido a assédio sexual no trabalho?' },
      { id: 'Q57', texto: 'Você foi submetido a ameaças de violência no trabalho?' },
      { id: 'Q58', texto: 'Você foi submetido a violência física no trabalho?' },
    ]
  },
  {
    id: 9,
    titulo: 'Grupo 9 - Jogos de Azar (JZ)',
    dominio: 'Comportamento de Jogo',
    descricao: 'Avaliação de comportamentos relacionados a jogos de azar',
    tipo: 'negativa',
    itens: [
      { id: 'Q59', texto: 'Com que frequência você joga em cassinos, bingos ou similares?' },
      { id: 'Q60', texto: 'Com que frequência você faz apostas esportivas?' },
      { id: 'Q61', texto: 'Com que frequência você joga em jogos online com apostas?' },
      { id: 'Q62', texto: 'Com que frequência você se sente preocupado com jogos de azar?' },
      { id: 'Q63', texto: 'Jogar já causou problemas financeiros para você?' },
      { id: 'Q64', texto: 'Jogar já interferiu em suas relações pessoais?' },
    ]
  },
  {
    id: 10,
    titulo: 'Grupo 10 - Endividamento (EF)',
    dominio: 'Endividamento Financeiro',
    descricao: 'Avaliação do nível de endividamento e estresse financeiro',
    tipo: 'negativa',
    itens: [
      { id: 'Q65', texto: 'Com que frequência você tem dificuldade para pagar suas contas?' },
      { id: 'Q66', texto: 'Com que frequência você se preocupa com suas dívidas?' },
      { id: 'Q67', texto: 'Com que frequência você precisa pedir dinheiro emprestado?' },
      { id: 'Q68', texto: 'Suas dívidas afetam seu desempenho no trabalho?' },
      { id: 'Q69', texto: 'Você já deixou de comprar itens essenciais por falta de dinheiro?' },
      { id: 'Q70', texto: 'O estresse financeiro afeta sua saúde mental?' },
    ]
  },
]

export const escalasResposta = {
  'Sempre': 100,
  'Muitas vezes': 75,
  'Às vezes': 50,
  'Raramente': 25,
  'Nunca': 0,
}

export type RespostaValor = keyof typeof escalasResposta
