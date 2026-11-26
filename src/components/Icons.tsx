interface IconProps {
  size?: number
  className?: string
}

export function PlusIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function GripIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="6" cy="9" r="1.5" />
      <circle cx="12" cy="9" r="1.5" />
      <circle cx="18" cy="9" r="1.5" />
      <circle cx="6" cy="15" r="1.5" />
      <circle cx="12" cy="15" r="1.5" />
      <circle cx="18" cy="15" r="1.5" />
    </svg>
  )
}

export function TrashIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
    </svg>
  )
}

export function ResizeHandleIcon({ size = 12, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M10 2L2 10M10 6L6 10" />
    </svg>
  )
}
