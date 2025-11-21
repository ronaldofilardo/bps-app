-- ETAPA 8: Diferenciação por nível (Operacional/Gestão)
-- Adicionar campo nivel_diferenciado na tabela questoes para armazenar questões específicas por nível

-- 1. Adicionar campo para diferenciação por nível
ALTER TABLE questoes
ADD COLUMN IF NOT EXISTS nivel_diferenciado VARCHAR(20);

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_questoes_nivel ON questoes (nivel_diferenciado);

-- 3. Atualizar questões existentes com versão OPERACIONAL (padrão)
UPDATE questoes
SET
    nivel_diferenciado = 'operacional'
WHERE
    nivel_diferenciado IS NULL;

-- 4. Criar questões específicas para GESTÃO baseadas na tabela fornecida
INSERT INTO
    questoes (
        grupo,
        numero,
        texto,
        nivel_diferenciado
    )
VALUES (
        1,
        1,
        'Com que frequência você tem muito serviço acumulado?',
        'gestao'
    ),
    (
        1,
        2,
        'Com que frequência você não consegue terminar tudo que precisa no dia?',
        'gestao'
    ),
    (
        1,
        3,
        'Com que frequência você tem que trabalhar em ritmo muito acelerado?',
        'gestao'
    ),
    (
        1,
        4,
        'Com que frequência seu trabalho exige que você faça as coisas bem rápido?',
        'gestao'
    ),
    (
        1,
        5,
        'Com que frequência você sente que está atrasado no trabalho?',
        'gestao'
    ),
    (
        1,
        6,
        'Com que frequência você tem tempo suficiente pra fazer tudo que precisa?',
        'gestao'
    ),
    (
        1,
        7,
        'Com que frequência seu trabalho exige que você fique o tempo todo concentrado?',
        'gestao'
    ),
    (
        2,
        8,
        'Com que frequência o trabalho te deixa emocionalmente acabado?',
        'gestao'
    ),
    (
        2,
        9,
        'Com que frequência o trabalho te deixa fisicamente exausto?',
        'gestao'
    ),
    (
        2,
        10,
        'Com que frequência você precisa esconder o que está sentindo de verdade?',
        'gestao'
    ),
    (
        2,
        11,
        'Com que frequência você enfrenta situações emocionalmente pesadas no trabalho?',
        'gestao'
    ),
    (
        3,
        12,
        'Você tem alguma influência sobre a quantidade de trabalho que recebe?',
        'gestao'
    ),
    (
        3,
        13,
        'Você tem liberdade pra decidir o que faz no dia a dia?',
        'gestao'
    ),
    (
        3,
        14,
        'Você tem liberdade pra decidir o jeito de fazer seu trabalho?',
        'gestao'
    ),
    (
        3,
        15,
        'Você precisa tomar iniciativa com frequência no seu trabalho?',
        'gestao'
    ),
    (
        3,
        16,
        'Você consegue usar suas habilidades e conhecimentos no dia a dia?',
        'gestao'
    ),
    (
        4,
        17,
        'Você tem oportunidades de se desenvolver e crescer profissionalmente?',
        'gestao'
    ),
    (
        4,
        18,
        'Você sente que o seu trabalho tem significado e importância?',
        'gestao'
    ),
    (
        4,
        19,
        'Você sente que o seu trabalho é importante e faz diferença para alguém ou para a empresa?',
        'gestao'
    ),
    (
        5,
        20,
        'Com que frequência seus colegas te ajudam e te apoiam?',
        'gestao'
    ),
    (
        5,
        21,
        'Com que frequência seus colegas te escutam quando você tem problemas no trabalho?',
        'gestao'
    ),
    (
        6,
        22,
        'Com que frequência seu chefe imediato te ajuda e te apoia?',
        'gestao'
    ),
    (
        6,
        23,
        'Seu chefe se preocupa com o bem-estar e satisfação da equipe?',
        'gestao'
    ),
    (
        6,
        24,
        'Seu chefe imediato é bom em planejar e organizar o trabalho?',
        'gestao'
    ),
    (
        6,
        25,
        'Seu chefe imediato é bom em resolver conflitos?',
        'gestao'
    ),
    (
        7,
        26,
        'Você recebe reconhecimento quando se esforça bastante?',
        'gestao'
    ),
    (
        7,
        27,
        'Você recebe retorno sobre como está seu desempenho?',
        'gestao'
    ),
    (
        7,
        28,
        'Você sente que seu trabalho é respeitado por colegas e chefia?',
        'gestao'
    ),
    (
        8,
        29,
        'Você está preocupado com a possibilidade de ficar desempregado?',
        'gestao'
    ),
    (
        8,
        30,
        'Você está preocupado que mudanças no trabalho prejudiquem você?',
        'gestao'
    ),
    (
        8,
        31,
        'Você teme ser transferido para outro setor/local contra sua vontade?',
        'gestao'
    ),
    (
        9,
        32,
        'Depois do trabalho, você ainda tem energia pra família e amigos?',
        'gestao'
    ),
    (
        9,
        33,
        'O trabalho te impede de passar tempo com família e amigos?',
        'gestao'
    ),
    (
        9,
        34,
        'Você sente que o trabalho está prejudicando sua vida pessoal?',
        'gestao'
    ),
    (
        10,
        35,
        'As pessoas escondem informações umas das outras?',
        'gestao'
    ),
    (
        10,
        36,
        'Os funcionários escondem informações da gerência?',
        'gestao'
    ),
    (
        10,
        37,
        'A liderança confia que os funcionários fazem bem o trabalho?',
        'gestao'
    ),
    (
        10,
        38,
        'Os funcionários confiam nas informações que vêm da liderança?',
        'gestao'
    ),
    (
        11,
        39,
        'Os conflitos são resolvidos de maneira justa?',
        'gestao'
    ),
    (
        11,
        40,
        'A distribuição das tarefas é feita de forma justa?',
        'gestao'
    ),
    (
        11,
        41,
        'As pessoas são valorizadas quando fazem um bom trabalho?',
        'gestao'
    ),
    (
        11,
        42,
        'Todos os funcionários são tratados de forma justa e igual?',
        'gestao'
    ),
    (
        12,
        43,
        'Eu consigo resolver problemas difíceis se me esforçar o suficiente',
        'gestao'
    ),
    (
        12,
        44,
        'Quando alguém se opõe, consigo encontrar formas de alcançar o que quero',
        'gestao'
    ),
    (
        12,
        45,
        'É fácil para mim manter o foco e alcançar meus objetivos',
        'gestao'
    ),
    (
        12,
        46,
        'Tenho confiança que consigo lidar bem com situações inesperadas',
        'gestao'
    ),
    (
        12,
        47,
        'Consigo ficar calmo em situações difíceis porque confio na minha capacidade',
        'gestao'
    ),
    (
        13,
        48,
        'Com que frequência você tem se sentido estressado?',
        'gestao'
    ),
    (
        13,
        49,
        'Com que frequência você se sentiu irritado ou tenso?',
        'gestao'
    ),
    (
        13,
        50,
        'Com que frequência você teve dificuldade para relaxar?',
        'gestao'
    ),
    (
        13,
        51,
        'Com que frequência você tem se sentido muito cansado?',
        'gestao'
    ),
    (
        13,
        52,
        'Com que frequência você teve problemas para dormir?',
        'gestao'
    ),
    (
        13,
        53,
        'Com que frequência você teve dor de cabeça?',
        'gestao'
    ),
    (
        13,
        54,
        'Com que frequência você teve dores musculares ou tensão no corpo?',
        'gestao'
    ),
    (
        13,
        55,
        'Com que frequência você sentiu que não consegue mais continuar?',
        'gestao'
    ),
    (
        14,
        56,
        'Você sofreu assédio sexual no ambiente de trabalho?',
        'gestao'
    ),
    (
        14,
        57,
        'Você sofreu ameaças de violência no trabalho?',
        'gestao'
    ),
    (
        14,
        58,
        'Você sofreu violência física no ambiente de trabalho?',
        'gestao'
    ),
    (
        15,
        59,
        'Você já fez apostas em jogos de azar (bet, loteria, cassino, jogo do bicho etc.)?',
        'gestao'
    ),
    (
        15,
        60,
        'Sentiu necessidade de apostar quantias maiores para ter a mesma emoção?',
        'gestao'
    ),
    (
        15,
        61,
        'Continuou apostando mesmo depois de perder dinheiro?',
        'gestao'
    ),
    (
        15,
        62,
        'Os pensamentos sobre apostas prejudicaram seu desempenho no trabalho?',
        'gestao'
    ),
    (
        15,
        63,
        'Já escondeu de familiares ou colegas quanto dinheiro gasta com apostas?',
        'gestao'
    ),
    (
        15,
        64,
        'Já usou o tempo de trabalho para fazer apostas?',
        'gestao'
    ),
    (
        16,
        65,
        'Você tem se sentido preocupado com dívidas ou contas atrasadas?',
        'gestao'
    ),
    (
        16,
        66,
        'O estresse com dívidas tem afetado sua concentração no trabalho?',
        'gestao'
    ),
    (
        16,
        67,
        'Já deixou de pagar contas essenciais (luz, água, comida) por falta de dinheiro?',
        'gestao'
    ),
    (
        16,
        68,
        'Já precisou fazer empréstimo (em banco, com agiota ou familiar) para pagar contas ou despesas?',
        'gestao'
    ),
    (
        16,
        69,
        'Discussões sobre dinheiro com família ou pessoas próximas já afetaram seu humor ou concentração no trabalho?',
        'gestao'
    ),
    (
        16,
        70,
        'Você sente que o seu nível de endividamento está fora de controle?',
        'gestao'
    );

-- 5. Verificar a diferenciação criada
SELECT '=== QUESTÕES POR NÍVEL ===' as titulo;

SELECT
    nivel_diferenciado,
    COUNT(*) as total_questoes,
    MIN(numero) as primeira_questao,
    MAX(numero) as ultima_questao
FROM questoes
GROUP BY
    nivel_diferenciado
ORDER BY nivel_diferenciado;

SELECT '=== EXEMPLO DE DIFERENCIAÇÃO - QUESTÃO 3 ===' as titulo;

SELECT
    numero,
    nivel_diferenciado,
    LEFT(texto, 80) || '...' as texto_resumido
FROM questoes
WHERE
    numero = 3
ORDER BY nivel_diferenciado;

SELECT '✅ ETAPA 8 CONCLUÍDA - DIFERENCIAÇÃO POR NÍVEL IMPLEMENTADA!' as resultado;