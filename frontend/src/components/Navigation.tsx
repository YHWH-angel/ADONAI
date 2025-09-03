export interface NavItem {
  key: string
  label: string
  onClick: () => void
}

interface Props {
  items: NavItem[]
}

export default function Navigation({ items }: Props) {
  return (
    <nav aria-label="main navigation" className="nav">
      {items.map((item) => (
        <button key={item.key} onClick={item.onClick} aria-label={item.key}>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
