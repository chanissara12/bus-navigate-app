import { stopSequenceFrom, type BoardableDirection } from '../lib/routeLookup'
import type { BusData } from '../lib/types'

interface Props {
  data: BusData
  boardable: BoardableDirection
  onBack: () => void
}

export function RouteDetailScreen({ data, boardable, onBack }: Props) {
  const upcomingStopIdxs = stopSequenceFrom(boardable.direction, boardable.positionInSequence)

  return (
    <div className="screen">
      <button type="button" className="back" onClick={onBack}>
        ← กลับ
      </button>
      <h2>
        {boardable.route.newCode} ไป {boardable.direction.headsignTh || boardable.direction.headsignEn}
      </h2>
      <ol className="stop-sequence">
        {upcomingStopIdxs.map((stopIdx, i) => (
          <li key={`${stopIdx}-${i}`} className={i === 0 ? 'current' : ''}>
            {data.stops[stopIdx].nameTh || data.stops[stopIdx].nameEn}
          </li>
        ))}
      </ol>
    </div>
  )
}
