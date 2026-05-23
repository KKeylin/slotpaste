interface Props {
  viewMode: 'canvas' | 'list'
  accentColor: string
  dark: boolean
  onChange: (mode: 'canvas' | 'list') => void
}

export default function ViewToggle({ viewMode, accentColor, dark, onChange }: Props) {
  return (
    <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${accentColor}` }}>
      {(['canvas', 'list'] as const).map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className="px-3 py-1 text-[10px] font-medium tracking-wide transition-colors"
          style={{
            backgroundColor: viewMode === mode
              ? (dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)')
              : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
            color: viewMode === mode
              ? (dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)')
              : (dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'),
          }}
        >
          {mode === 'canvas' ? 'Canvas' : 'List'}
        </button>
      ))}
    </div>
  )
}