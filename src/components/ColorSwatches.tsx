import colorWheelImg from '../assets/color-wheel-2.png'

interface Props {
  colors: string[]
  selectedColor?: string
  size?: 'sm' | 'md'
  accentColor?: string
  wheelValue: string
  onSelect: (color: string) => void
  onWheelChange: (color: string) => void
  onWheelBlur?: (color: string) => void
}

const dimensions = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
}

export default function ColorSwatches({
  colors,
  selectedColor,
  size = 'sm',
  accentColor = 'rgba(255,255,255,0.75)',
  wheelValue,
  onSelect,
  onWheelChange,
  onWheelBlur,
}: Props) {
  const dim = dimensions[size]

  return (
    <div className="flex items-center gap-1.5">
      {colors.map((c, i) => (
        <button
          key={`${c}-${i}`}
          onClick={() => onSelect(c)}
          className={`${dim} rounded-full transition-transform hover:scale-110 flex-shrink-0`}
          style={{
            backgroundColor: c,
            border: selectedColor === c
              ? `2px solid ${accentColor}`
              : '2px solid rgba(255,255,255,0.12)',
          }}
        />
      ))}

      <label className={`${dim} rounded-full cursor-pointer hover:scale-110 transition-transform relative overflow-hidden flex-shrink-0`}>
        <img src={colorWheelImg} className="w-full h-full object-cover rounded-full" alt="" />
        <input
          type="color"
          value={wheelValue}
          onChange={(e) => onWheelChange(e.target.value)}
          onBlur={onWheelBlur ? (e) => onWheelBlur(e.target.value) : undefined}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </label>
    </div>
  )
}