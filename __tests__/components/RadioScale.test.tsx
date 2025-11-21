import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import RadioScale from '@/components/RadioScale'

describe('RadioScale', () => {
  const defaultProps = {
    questionId: 'test-question',
    questionText: 'Esta é uma pergunta de teste?',
    value: null,
    onChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar a pergunta corretamente', () => {
    render(<RadioScale {...defaultProps} />)
    
    expect(screen.getByText('Esta é uma pergunta de teste?')).toBeInTheDocument()
  })

  it('deve renderizar todas as opções de resposta', () => {
    render(<RadioScale {...defaultProps} />)
    
    // Verifica se todas as 5 opções estão presentes
    expect(screen.getByText('Sempre')).toBeInTheDocument()
    expect(screen.getByText('Muitas vezes')).toBeInTheDocument()
    expect(screen.getByText('Às vezes')).toBeInTheDocument()
    expect(screen.getByText('Raramente')).toBeInTheDocument()
    expect(screen.getByText('Nunca')).toBeInTheDocument()
  })

  it('deve chamar onChange quando uma opção é selecionada', () => {
    const mockOnChange = jest.fn()
    render(<RadioScale {...defaultProps} onChange={mockOnChange} />)
    
    const sempreButton = screen.getByText('Sempre')
    fireEvent.click(sempreButton)
    
    expect(mockOnChange).toHaveBeenCalledWith(100)
  })

  it('deve destacar a opção selecionada', () => {
    render(<RadioScale {...defaultProps} value={75} />)
    
    const muitasVezesButton = screen.getByText('Muitas vezes')
    expect(muitasVezesButton.closest('button')).toHaveClass('border-primary')
  })

  it('deve mostrar círculo preenchido para opção selecionada', () => {
    render(<RadioScale {...defaultProps} value={50} />)
    
    const asVezesButton = screen.getByText('Às vezes')
    const circle = asVezesButton.closest('button')?.querySelector('div')
    expect(circle).toHaveClass('border-primary', 'bg-primary')
  })

  it('deve aplicar classes responsivas corretas', () => {
    render(<RadioScale {...defaultProps} />)
    // O grid das opções é o div pai dos botões
    const gridContainer = screen.getByText('Sempre').closest('div.grid')
    expect(gridContainer).toHaveClass('grid-cols-5')
    // Verifica texto responsivo dos labels
    const sempreLabel = screen.getByText('Sempre')
    expect(sempreLabel).toHaveClass('text-xs')
  })

  it('deve aplicar classe required quando necessário', () => {
    render(<RadioScale {...defaultProps} required={true} />)
    
    const label = screen.getByText('Esta é uma pergunta de teste?')
    expect(label).toHaveClass('required')
  })

  it('deve não aplicar classe required quando não necessário', () => {
    render(<RadioScale {...defaultProps} required={false} />)
    
    const label = screen.getByText('Esta é uma pergunta de teste?')
    expect(label).not.toHaveClass('required')
  })

  it('deve ter title apropriado para cada botão', () => {
    render(<RadioScale {...defaultProps} />)
    
    const sempreButton = screen.getByText('Sempre').closest('button')
    expect(sempreButton).toHaveAttribute('title', 'Sempre')
    
    const nuncaButton = screen.getByText('Nunca').closest('button')
    expect(nuncaButton).toHaveAttribute('title', 'Nunca')
  })

  it('deve aplicar hover styles nos botões não selecionados', () => {
    render(<RadioScale {...defaultProps} value={null} />)
    
    const sempreButton = screen.getByText('Sempre').closest('button')
    expect(sempreButton).toHaveClass('hover:border-primary', 'hover:bg-gray-50')
  })

  it('deve renderizar corretamente sem valor inicial', () => {
    render(<RadioScale {...defaultProps} />)
    
    // Nenhuma opção deve estar selecionada
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).not.toHaveClass('border-primary')
    })
  })

  it('deve lidar com mudança de valores corretamente', () => {
    const mockOnChange = jest.fn()
    const { rerender } = render(<RadioScale {...defaultProps} onChange={mockOnChange} value={null} />)

    // Seleciona "Raramente"
    fireEvent.click(screen.getByText('Raramente'))
    expect(mockOnChange).toHaveBeenCalledWith(25)

    // Rerender com novo valor
    rerender(<RadioScale {...defaultProps} onChange={mockOnChange} value={25} />)

    const raramenteButton = screen.getByText('Raramente').closest('button')
    expect(raramenteButton).toHaveClass('border-primary')
  })

  it('deve renderizar as opções na ordem correta (Nunca para Sempre)', () => {
    render(<RadioScale {...defaultProps} />)

    const buttons = screen.getAllByRole('button')
    const buttonTexts = buttons.map(button => button.textContent?.trim())

    expect(buttonTexts).toEqual(['Nunca', 'Raramente', 'Às vezes', 'Muitas vezes', 'Sempre'])
  })
})