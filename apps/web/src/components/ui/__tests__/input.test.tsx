import { render, screen, fireEvent } from '@/lib/test-utils'
import { Input } from '../input'

describe('Input Component', () => {
  it('renders input field', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('handles value changes', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test value' } })
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input')
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Input ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  it('handles different input types', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('applies focus styles', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    fireEvent.focus(input)
    expect(input).toHaveClass('focus-visible:ring-2')
  })

  it('handles required attribute', () => {
    render(<Input required />)
    const input = screen.getByRole('textbox')
    expect(input).toBeRequired()
  })

  it('handles readonly attribute', () => {
    render(<Input readOnly />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('readonly')
  })
})