import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Option = { value: string; label: string }

type FormSelectProps = {
  id: string
  value: string
  options: readonly Option[]
  disabled?: boolean
  onValueChange: (value: string) => void
}

export function FormSelect({
  id,
  value,
  options,
  disabled,
  onValueChange,
}: FormSelectProps) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next == null) return
        onValueChange(next)
      }}
    >
      <SelectTrigger id={id} className="w-full max-w-md">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
