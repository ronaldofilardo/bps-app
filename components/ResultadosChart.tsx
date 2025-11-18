'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js'
import { getRelatorioGrupo } from '@/lib/relatorio-dados'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface Resultado {
  grupo: number
  dominio: string
  score: number
  categoria: 'baixo' | 'medio' | 'alto'
  tipo: 'positiva' | 'negativa' | 'mista'
}

interface ResultadosChartProps {
  resultados: Resultado[]
}

export default function ResultadosChart({ resultados = [] }: ResultadosChartProps) {
  if (!resultados || resultados.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Nenhum dado disponível para exibir o gráfico
      </div>
    );
  }
  // Função para obter cor da barra baseada no tipo e categoria
  const getBarColor = (resultado: Resultado): string => {
    if (resultado.tipo === 'negativa') {
      // Negativa: alto score = vermelho (ruim)
      if (resultado.categoria === 'alto') return '#EF4444'
      if (resultado.categoria === 'medio') return '#F59E0B'
      return '#10B981'
    } else {
      // Positiva: alto score = verde (bom)
      if (resultado.categoria === 'alto') return '#10B981'
      if (resultado.categoria === 'medio') return '#F59E0B'
      return '#EF4444'
    }
  }

  // Função para criar gradiente de fundo (semáforo)
  const createBackgroundGradient = (ctx: CanvasRenderingContext2D, tipo: 'positiva' | 'negativa' | 'mista') => {
    const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0)
    
    if (tipo === 'negativa') {
      // Para negativos: verde (0-33), amarelo (34-66), vermelho (67-100)
      gradient.addColorStop(0, '#10B981')
      gradient.addColorStop(0.33, '#10B981')
      gradient.addColorStop(0.34, '#F59E0B')
      gradient.addColorStop(0.66, '#F59E0B')
      gradient.addColorStop(0.67, '#EF4444')
      gradient.addColorStop(1, '#EF4444')
    } else {
      // Para positivos: vermelho (0-33), amarelo (34-66), verde (67-100)
      gradient.addColorStop(0, '#EF4444')
      gradient.addColorStop(0.33, '#EF4444')
      gradient.addColorStop(0.34, '#F59E0B')
      gradient.addColorStop(0.66, '#F59E0B')
      gradient.addColorStop(0.67, '#10B981')
      gradient.addColorStop(1, '#10B981')
    }
    
    return gradient
  }

  const data: ChartData<'bar'> = {
    labels: resultados.map(r => {
      const dadosGrupo = getRelatorioGrupo(r.grupo)
      return dadosGrupo?.nome || r.dominio
    }),
    datasets: [
      {
        label: 'Pontuação',
        data: resultados.map(r => {
          // Para score zero, retorna valor mínimo para forçar barra visível
          if (Number(r.score) === 0) return 0.5;
          return Number(Number(r.score).toFixed(1));
        }),
        backgroundColor: resultados.map(r =>
          Number(r.score) === 0 ? '#E5E7EB' : getBarColor(r)
        ),
        borderColor: resultados.map(r =>
          Number(r.score) === 0 ? '#A3A3A3' : getBarColor(r)
        ),
        borderWidth: resultados.map(r => Number(r.score) === 0 ? 2 : 1),
        barThickness: 30,
      }
    ]
  }

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            // Recupera o score original do resultado
            const originalScore = Number(resultados[context.dataIndex]?.score);
            if (originalScore === 0) {
              return '0% (avaliado)';
            }
            return `${context.parsed.x?.toFixed(1) || '0.0'}%`;
          }
        }
      },
      // datalabels: {
      //   display: true,
      //   color: '#222',
      //   font: {
      //     weight: 'bold',
      //   },
      //   align: 'center',
      //   anchor: 'center',
      //   formatter: function (value: number, context: any) {
      //     const originalScore = Number(resultados[context.dataIndex]?.score);
      //     if (originalScore === 0) return '0% (avaliado)';
      //     return `${value}%`;
      //   },
      // },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%'
          }
        },
        grid: {
          display: true,
          color: '#E5E7EB',
        }
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          callback: function(value, index) {
            const label = this.getLabelForValue(value as number)
            return label.length > 25 ? label.substring(0, 25) + '...' : label
          }
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 4,
      }
    },
    animation: false,
    onHover: (event, elements) => {
      if (event.native?.target) {
        (event.native.target as HTMLCanvasElement).style.cursor = elements.length > 0 ? 'pointer' : 'default'
      }
    }
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-3 sm:p-6 mb-4 sm:mb-6 print:static print:transform-none print:w-full">
      <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center print:text-base">
        📊 Visão Geral dos Resultados
      </h3>
      <div className="relative print:static print:transform-none print:w-full" style={{ height: `${Math.max(250, resultados.length * 35)}px` }}>
        <Bar data={data} options={options} />
      </div>
      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-center space-y-1 sm:space-y-0 sm:space-x-4 sm:space-x-6 text-xs print:flex-col print:space-y-1 print:space-x-0">
        <div className="flex items-center justify-center print:justify-start">
          <div className="w-3 h-3 bg-green-500 rounded mr-2 print:w-3 print:h-3"></div>
          <span>Adequado/Excelente</span>
        </div>
        <div className="flex items-center justify-center print:justify-start">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-2 print:w-3 print:h-3"></div>
          <span>Monitorar/Adequado</span>
        </div>
        <div className="flex items-center justify-center print:justify-start">
          <div className="w-3 h-3 bg-red-500 rounded mr-2 print:w-3 print:h-3"></div>
          <span>Atenção/Melhorar</span>
        </div>
      </div>
    </div>
  )
}