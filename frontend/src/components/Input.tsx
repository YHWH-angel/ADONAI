import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
}

export default function Input({ id, label, ...props }: InputProps) {
  return (
    <div className="form-control">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...props} />
    </div>
  )
}
