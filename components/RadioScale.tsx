'use client'

import { escalasResposta, RespostaValor } from '@/lib/questoes'

interface RadioScaleProps {
  questionId: string
  questionText: string
  value: number | null
  onChange: (value: number) => void
  required?: boolean
}

export default function RadioScale({
  questionId,
  questionText,
  value,
  onChange,
  required = true,
}: RadioScaleProps) {
  const opcoes = Object.entries(escalasResposta) as [RespostaValor, number][]

  return (
    <div className="py-4 border-b border-gray-200">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div>
          <label htmlFor={questionId} className={`text-sm sm:text-base font-medium text-gray-700 ${required ? 'required' : ''}`}>
            {questionText}
          </label>
        </div>

        <div className="grid grid-cols-5 gap-1 xs:gap-2">
          {opcoes.map(([label, val]) => (
            <button
              key={val}
              type="button"
              onClick={() => onChange(val)}
              className={`flex flex-col items-center justify-center p-1 xs:p-2 rounded-lg border-2 transition-all ${
                value === val
                  ? 'border-primary bg-primary-light'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }`}
              title={label}
            >
              <div
                className={`w-4 h-4 xs:w-6 xs:h-6 rounded-full border-2 flex items-center justify-center ${
                  value === val
                    ? 'border-primary bg-primary'
                    : 'border-gray-400 bg-white'
                }`}
              >
                {value === val && (
                  <div className="w-2 h-2 xs:w-3 xs:h-3 rounded-full bg-white"></div>
                )}
              </div>
              <span className="text-xs mt-1 text-gray-600 hidden xs:block">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
