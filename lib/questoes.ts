// Dados dos grupos de avaliação COPSOQ III + JZ + EF

export interface QuestionCondition {
  questionId: string // ID da questão que determina a condição
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne' // Operador de comparação
  value: number // Valor para comparação
}

export interface QuestionItem {
  id: string
  texto: string
  textoGestao?: string // Texto específico para gestão
  invertida?: boolean // Para cálculo de score (alguns itens são negativos)
  condition?: QuestionCondition // Condição para exibir a questão
  category?: 'behavioral' | 'financial' | 'health' | 'core' // Categoria da questão
}

export interface GrupoAvaliacao {
  id: number
  titulo: string
  dominio: string
  descricao: string
  itens: QuestionItem[]
  tipo: 'positiva' | 'negativa'
}

export const grupos: GrupoAvaliacao[] = [
  {
    id: 1,
    titulo: 'Grupo 1 - Demandas no Trabalho',
    dominio: 'Demandas no Trabalho',
    descricao: 'Avaliação das exigências quantitativas e ritmo de trabalho',
    tipo: 'negativa',
    itens: [
      { id: 'Q1', texto: 'Com que frequência você tem muito serviço pra fazer?', textoGestao: 'Com que frequência você tem um volume elevado de trabalho?' },
      { id: 'Q2', texto: 'Com que frequência você não dá conta de terminar tudo que precisa fazer?', textoGestao: 'Com que frequência você não consegue completar todas as suas tarefas?' },
      { id: 'Q3', texto: 'Com que frequência você precisa trabalhar correndo?', textoGestao: 'Com que frequência você precisa trabalhar em ritmo acelerado?' },
      { id: 'Q4', texto: 'Com que frequência seu serviço exige que você faça as coisas muito rápido?', textoGestao: 'Com que frequência seu trabalho exige que você execute as tarefas com alta velocidade?' },
      { id: 'Q5', texto: 'Com que frequência você fica atrasado no serviço?', textoGestao: 'Com que frequência você fica para trás com suas entregas/trabalho?' },
      { id: 'Q6', texto: 'Com que frequência você tem tempo suficiente pra fazer tudo que precisa?', textoGestao: 'Com que frequência você dispõe de tempo adequado para concluir suas tarefas?', invertida: true },
      { id: 'Q7', texto: 'Com que frequência seu serviço exige que você fique o tempo todo ligado/antenado?', textoGestao: 'Com que frequência seu trabalho exige atenção constante?' },
      { id: 'Q8', texto: 'Com que frequência o trabalho te deixa emocionalmente acabado?', textoGestao: 'Com que frequência seu trabalho te deixa emocionalmente esgotado?' },
      { id: 'Q9', texto: 'Com que frequência o trabalho te deixa com o corpo moído/cansado?', textoGestao: 'Com que frequência seu trabalho te deixa fisicamente exaurido?' },
      { id: 'Q10', texto: 'Com que frequência você precisa esconder o que está sentindo?', textoGestao: 'Com que frequência você precisa ocultar seus sentimentos no trabalho?' },
      { id: 'Q11', texto: 'Com que frequência você lida com situações que mexem com suas emoções?', textoGestao: 'Com que frequência você enfrenta situações emocionalmente desafiadoras?' },
    ]
  },
  {
    id: 2,
    titulo: 'Grupo 2 - Organização e Conteúdo',
    dominio: 'Organização e Conteúdo do Trabalho',
    descricao: 'Influência, desenvolvimento de habilidades e significado do trabalho',
    tipo: 'positiva',
    itens: [
      { id: 'Q12', texto: 'Você consegue ter alguma palavra sobre quanta coisa te passam pra fazer?', textoGestao: 'Você pode influenciar a quantidade de trabalho que lhe é atribuída?' },
      { id: 'Q13', texto: 'Você consegue decidir o que faz no trabalho?', textoGestao: 'Você pode influenciar as atividades que realiza no trabalho?' },
      { id: 'Q14', texto: 'Você tem liberdade pra decidir como faz o seu serviço?', textoGestao: 'Você tem influência sobre a forma como executa seu trabalho?' },
      { id: 'Q15', texto: 'Seu serviço exige que você tome a frente e faça as coisas acontecerem?', textoGestao: 'Seu trabalho exige que você tome iniciativa?' },
      { id: 'Q16', texto: 'Você consegue usar o que sabe e suas habilidades no dia a dia do trabalho?', textoGestao: 'Você pode aplicar suas competências e expertise no trabalho?' },
      { id: 'Q17', texto: 'Você tem chance de aprender coisas novas e crescer no trabalho?', textoGestao: 'Você tem oportunidades de desenvolvimento pessoal no trabalho?' },
      { id: 'Q18', texto: 'Você acha que o seu trabalho tem sentido/faz diferença?', textoGestao: 'Você considera seu trabalho significativo?' },
      { id: 'Q19', texto: 'Você sente que o que você faz é importante?', textoGestao: 'Você sente que o trabalho que realiza é importante?' },
    ]
  },
  {
    id: 3,
    titulo: 'Grupo 3 - Relações Interpessoais',
    dominio: 'Relações Sociais e Liderança',
    descricao: 'Apoio social, feedback e reconhecimento no trabalho',
    tipo: 'positiva',
    itens: [
      { id: 'Q20', texto: 'Com que frequência os colegas te ajudam e te dão apoio?', textoGestao: 'Com que frequência você recebe ajuda e suporte dos colegas?' },
      { id: 'Q21', texto: 'Com que frequência os colegas param pra te ouvir quando você tem problema no trabalho?', textoGestao: 'Com que frequência seus colegas estão dispostos a ouvir seus problemas relacionados ao trabalho?' },
      { id: 'Q22', texto: 'Com que frequência seu chefe direto te ajuda e te apoia?', textoGestao: 'Com que frequência você recebe ajuda e suporte do seu superior imediato?' },
      { id: 'Q23', texto: 'Seu chefe direto se preocupa se você está satisfeito no trabalho?', textoGestao: 'Seu superior imediato prioriza a satisfação no trabalho?' },
      { id: 'Q24', texto: 'Seu chefe direto é bom em organizar e planejar o serviço?', textoGestao: 'Seu superior imediato é bom em planejar o trabalho?' },
      { id: 'Q25', texto: 'Seu chefe direto é bom em resolver briga/discussão no time?', textoGestao: 'Seu superior imediato é bom em resolver conflitos?' },
      { id: 'Q26', texto: 'Você recebe reconhecimento quando se esforça no trabalho?', textoGestao: 'Você recebe reconhecimento pelo esforço realizado no trabalho?' },
      { id: 'Q27', texto: 'Você recebe retorno/feedback sobre como está indo no trabalho?', textoGestao: 'Você recebe feedback sobre seu desempenho?' },
      { id: 'Q28', texto: 'Seu trabalho é respeitado pelos colegas e chefes?', textoGestao: 'Seu trabalho é valorizado por colegas e superiores?' },
    ]
  },
  {
    id: 4,
    titulo: 'Grupo 4 - Interface Trabalho-Indivíduo',
    dominio: 'Interface Trabalho-Indivíduo',
    descricao: 'Insegurança no trabalho e conflito trabalho-família',
    tipo: 'negativa',
    itens: [
      { id: 'Q29', texto: 'Você está preocupado em ficar desempregado?', textoGestao: 'Você está preocupado com a possibilidade de desemprego?' },
      { id: 'Q30', texto: 'Você tem medo que mudanças no trabalho piorem sua situação?', textoGestao: 'Você está preocupado que mudanças organizacionais prejudiquem sua situação profissional?' },
      { id: 'Q31', texto: 'Você tem medo de ser transferido pra outro lugar sem querer?', textoGestao: 'Você está preocupado com a possibilidade de transferência contra sua vontade?' },
      { id: 'Q32', texto: 'Depois do trabalho, você ainda tem energia pra ficar com família e amigos?', textoGestao: 'Você tem energia suficiente para família e amigos no tempo livre?', invertida: true },
      { id: 'Q33', texto: 'O trabalho toma o tempo que você queria passar com família e amigos?', textoGestao: 'Seu trabalho consome tempo que gostaria de dedicar à família e amigos?' },
      { id: 'Q34', texto: 'Você acha que o trabalho está atrapalhando sua vida pessoal?', textoGestao: 'Você sente que seu trabalho prejudica sua vida privada?' },
    ]
  },
  {
    id: 5,
    titulo: 'Grupo 5 - Valores no Trabalho',
    dominio: 'Valores Organizacionais',
    descricao: 'Confiança, justiça e respeito mútuo na organização',
    tipo: 'positiva',
    itens: [
      { id: 'Q35', texto: 'Os funcionários escondem coisas uns dos outros?', textoGestao: 'Os colaboradores ocultam informações entre si?', invertida: true },
      { id: 'Q36', texto: 'Os funcionários escondem coisas da chefia?', textoGestao: 'Os colaboradores ocultam informações da gestão?', invertida: true },
      { id: 'Q37', texto: 'A chefia confia que os funcionários vão fazer o serviço direito?', textoGestao: 'A gestão confia que os colaboradores realizem bem seu trabalho?' },
      { id: 'Q38', texto: 'Os funcionários confiam nas informações que vêm da chefia?', textoGestao: 'Os colaboradores confiam nas informações fornecidas pela gestão?' },
      { id: 'Q39', texto: 'Quando rola briga, ela é resolvida de forma justa?', textoGestao: 'Os conflitos são resolvidos de maneira justa?' },
      { id: 'Q40', texto: 'O serviço é dividido de forma justa entre todo mundo?', textoGestao: 'A distribuição das tarefas é feita de forma justa?' },
      { id: 'Q41', texto: 'Quem faz um bom trabalho é valorizado?', textoGestao: 'Os colaboradores são reconhecidos quando realizam um bom trabalho?' },
      { id: 'Q42', texto: 'Todo mundo é tratado do mesmo jeito, de forma justa?', textoGestao: 'Todos os colaboradores são tratados de forma equitativa?' },
    ]
  },
  {
    id: 6,
    titulo: 'Grupo 6 - Personalidade (Opcional)',
    dominio: 'Traços de Personalidade',
    descricao: 'Autoeficácia e autoconfiança',
    tipo: 'positiva',
    itens: [
      { id: 'Q43', texto: 'Eu sempre consigo resolver problemas difíceis se eu me esforçar bastante', textoGestao: 'Eu consigo resolver problemas difíceis se eu me esforçar o suficiente' },
      { id: 'Q44', texto: 'Se alguém me impedir, eu dou um jeito de conseguir o que quero', textoGestao: 'Se alguém se opuser, consigo encontrar meios de alcançar o que desejo' },
      { id: 'Q45', texto: 'É fácil pra mim continuar firme nas minhas metas e conseguir alcançá-las', textoGestao: 'É fácil para mim manter o foco nas metas e atingir meus objetivos' },
      { id: 'Q46', texto: 'Eu me sinto seguro de que consigo lidar bem com coisas inesperadas', textoGestao: 'Estou confiante de que posso lidar eficientemente com eventos inesperados' },
      { id: 'Q47', texto: 'Eu fico calmo quando aparece dificuldade porque confio no que eu sei', textoGestao: 'Consigo permanecer calmo diante de dificuldades porque confio nas minhas habilidades' },
    ]
  },
  {
    id: 7,
    titulo: 'Grupo 7 - Saúde e Bem-Estar',
    dominio: 'Saúde e Bem-Estar',
    descricao: 'Avaliação de estresse, burnout e sintomas somáticos',
    tipo: 'negativa',
    itens: [
      { id: 'Q48', texto: 'Com que frequência você se sentiu estressado?', textoGestao: 'Com que frequência você se sentiu estressado?' },
      { id: 'Q49', texto: 'Com que frequência você ficou irritado ou muito tenso?', textoGestao: 'Com que frequência você se sentiu irritável ou tenso?' },
      { id: 'Q50', texto: 'Com que frequência você teve dificuldade pra relaxar?', textoGestao: 'Com que frequência você teve dificuldade para relaxar?' },
      { id: 'Q51', texto: 'Com que frequência você se sentiu cansado?', textoGestao: 'Com que frequência você se sentiu fatigado?' },
      { id: 'Q52', texto: 'Com que frequência você teve problema pra dormir?', textoGestao: 'Com que frequência você apresentou dificuldades para dormir?' },
      { id: 'Q53', texto: 'Com que frequência você teve dor de cabeça?', textoGestao: 'Com que frequência você teve cefaleias?' },
      { id: 'Q54', texto: 'Com que frequência você teve dor nos músculos ou no corpo?', textoGestao: 'Com que frequência você teve dores musculares?' },
      { id: 'Q55', texto: 'Com que frequência você sentiu que não aguenta mais?', textoGestao: 'Com que frequência você sentiu que não consegue continuar?' },
    ]
  },
  {
    id: 8,
    titulo: 'Grupo 8 - Comportamentos Ofensivos',
    dominio: 'Comportamentos Ofensivos',
    descricao: 'Exposição a assédio e violência no trabalho',
    tipo: 'negativa',
    itens: [
      { id: 'Q56', texto: 'Você sofreu assédio sexual no trabalho?', textoGestao: 'Você foi submetido a assédio sexual no ambiente de trabalho?' },
      { id: 'Q57', texto: 'Você sofreu ameaças de violência no trabalho?', textoGestao: 'Você foi submetido a ameaças de violência no trabalho?' },
      { id: 'Q58', texto: 'Você sofreu violência física no trabalho?', textoGestao: 'Você foi vítima de violência física no trabalho?' },
    ]
  },
  {
    id: 9,
    titulo: 'Grupo 9 - Jogos de Apostas',
    dominio: 'Comportamento de Jogo',
    descricao: 'Avaliação de comportamentos relacionados a jogos de azar',
    tipo: 'negativa',
    itens: [
      { id: 'Q59', texto: 'Você fez apostas em jogos de azar (bet, loteria, jogo do bicho, cassino online etc.)?', textoGestao: 'Você realizou apostas em jogos de azar (ex.: apostas esportivas, loterias, jogo do bicho, cassinos online)?' },
      { id: 'Q60', texto: 'Você sentiu que precisava apostar mais dinheiro pra sentir a mesma emoção?', textoGestao: 'Você sentiu necessidade de aumentar o valor das apostas para obter a mesma excitação?' },
      { id: 'Q61', texto: 'Mesmo perdendo dinheiro, você continuou apostando?', textoGestao: 'Você persistiu nas apostas mesmo após perdas financeiras?' },
      { id: 'Q62', texto: 'Pensar em apostas atrapalhou seu rendimento no trabalho?', textoGestao: 'Os pensamentos sobre apostas prejudicaram seu desempenho profissional?' },
      { id: 'Q63', texto: 'Você escondeu de colegas ou da família quanto dinheiro apostava?', textoGestao: 'Você ocultou de colegas ou familiares o montante apostado?' },
      { id: 'Q64', texto: 'Você usou o celular ou horário de trabalho pra fazer apostas?', textoGestao: 'Você utilizou tempo de trabalho (celular, intervalos) para realizar apostas?' },
    ]
  },
  {
    id: 10,
    titulo: 'Grupo 10 - Endividamento',
    dominio: 'Endividamento Financeiro',
    descricao: 'Avaliação do nível de endividamento e estresse financeiro',
    tipo: 'negativa',
    itens: [
      { id: 'Q65', texto: 'Você ficou preocupado com dívidas ou contas pra pagar?', textoGestao: 'Você se sentiu preocupado com dívidas ou pagamento de contas?' },
      { id: 'Q66', texto: 'O estresse com dívidas atrapalhou sua concentração no trabalho?', textoGestao: 'O estresse financeiro afetou sua concentração no trabalho?' },
      { id: 'Q67', texto: 'Você deixou de pagar conta de luz, água ou comida por falta de dinheiro?', textoGestao: 'Você deixou de pagar contas essenciais (água, luz, alimentação) por insuficiência financeira?' },
      { id: 'Q68', texto: 'Você precisou pegar empréstimo (banco, agiota ou familiar) pra pagar as contas?', textoGestao: 'Você precisou contrair empréstimos (bancário, agiota ou familiar) para cobrir despesas?' },
      { id: 'Q69', texto: 'Brigas ou conversas sobre dinheiro com família ou colegas estragaram seu humor no trabalho?', textoGestao: 'Discussões sobre dinheiro com família ou colegas impactaram negativamente seu humor no trabalho?' },
      { id: 'Q70', texto: 'Você sente que suas dívidas estão fora de controle?', textoGestao: 'Você sente que seu nível de endividamento está fora de controle?' },
    ]
  },
]

export const escalasResposta = {
  'Nunca': 0,
  'Raramente': 25,
  'Às vezes': 50,
  'Muitas vezes': 75,
  'Sempre': 100,
}

export type RespostaValor = keyof typeof escalasResposta

// Função para obter texto da questão baseado no nível do funcionário
export function getTextoQuestao(item: QuestionItem, nivelCargo: 'operacional' | 'gestao'): string {
  if (nivelCargo === 'gestao' && item.textoGestao) {
    return item.textoGestao
  }
  return item.texto
}

// Função para obter todas as questões com diferenciação por nível
export function getQuestoesPorNivel(nivelCargo: 'operacional' | 'gestao') {
  return grupos.map(grupo => ({
    ...grupo,
    itens: grupo.itens.map(item => ({
      ...item,
      texto: getTextoQuestao(item, nivelCargo)
    }))
  }))
}
