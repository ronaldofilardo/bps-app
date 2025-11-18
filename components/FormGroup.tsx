'use client'

import { GrupoAvaliacao } from '@/lib/questoes'
import RadioScale from './RadioScale'

interface FormGroupProps {
  grupo: GrupoAvaliacao
  respostas: Map<string, number>
  onChange: (itemId: string, valor: number) => void
}

export default function FormGroup({ grupo, respostas, onChange }: FormGroupProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{grupo.titulo}</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-2">{grupo.descricao}</p>
      </div>

      <div className="space-y-2">
        {grupo.itens.map((item) => (
          <RadioScale
            key={item.id}
            questionId={item.id}
            questionText={item.texto}
            value={respostas.get(item.id) ?? null}
            onChange={(valor) => onChange(item.id, valor)}
          />
        ))}
      </div>

      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
        <p className="text-xs sm:text-sm text-blue-800">
          <strong>Instruções:</strong> Responda todas as perguntas pensando nas últimas 4 semanas.
          Selecione a opção que melhor representa sua situação.
        </p>
      </div>
    </div>
  )
}
