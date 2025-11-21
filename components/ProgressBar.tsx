'use client'

interface ProgressBarProps {
  currentGroup: number
  totalGroups: number
  currentQuestion?: number
  totalQuestions?: number
  groupTitle?: string
}

export default function ProgressBar({ 
  currentGroup, 
  totalGroups, 
  currentQuestion = 0, 
  totalQuestions = 0, 
  groupTitle 
}: ProgressBarProps) {
  const overallProgress = (currentGroup / totalGroups) * 100
  const groupProgress = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0

  // Seções do COPSOQ-III
  const secoes = [
    { nome: 'Demandas', grupos: [1] },
    { nome: 'Organização', grupos: [2] },
    { nome: 'Relações Sociais', grupos: [3, 4] },
    { nome: 'Liderança', grupos: [5] },
    { nome: 'Valores', grupos: [6] },
    { nome: 'Saúde', grupos: [7] },
    { nome: 'Comportamentos', grupos: [8] },
    { nome: 'Extras', grupos: [9, 10] }
  ]

  const secaoAtual = secoes.find(s => s.grupos.includes(currentGroup))

  return (
    <div className="mb-6">
      {/* Progress geral */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">Progresso Geral</h3>
          <span className="text-xs text-gray-500">{Math.round(overallProgress)}% concluído</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>Grupo {currentGroup} de {totalGroups}</span>
          {secaoAtual && <span className="font-medium">Seção: {secaoAtual.nome}</span>}
        </div>
      </div>

      {/* Progress do grupo atual */}
      {totalQuestions > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-600">
              {groupTitle || `Grupo ${currentGroup}`}
            </h4>
            <span className="text-xs text-gray-500">{Math.round(groupProgress)}% do grupo</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-secondary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${groupProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>Questão {currentQuestion} de {totalQuestions}</span>
            <span>{totalQuestions - currentQuestion} restantes</span>
          </div>
        </div>
      )}
    </div>
  )
}
