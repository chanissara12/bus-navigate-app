import { stopSequenceFrom, type BoardableDirection } from '../lib/routeLookup'
import { formatRouteCode } from '../lib/formatRoute'
import { useMapBackground } from '../lib/useMapBackground'
import type { BusData } from '../lib/types'
import { RouteMap } from './RouteMap'

interface Props {
  data: BusData
  boardable: BoardableDirection
  onBack: () => void
}

export function RouteDetailScreen({ data, boardable, onBack }: Props) {
  const upcomingStopIdxs = stopSequenceFrom(boardable.direction, boardable.positionInSequence)
  const { background, error } = useMapBackground()

  return (
    <div className="screen">
      <button type="button" className="back" onClick={onBack}>
        ← กลับ
      </button>
      <h2>
        {formatRouteCode(boardable.route)} ไป {boardable.direction.headsignTh || boardable.direction.headsignEn}
      </h2>

      {background && (
        <RouteMap
          data={data}
          background={background}
          direction={boardable.direction}
          fromPosition={boardable.positionInSequence}
        />
      )}
      {error && <p className="status error">โหลดแผนที่ไม่ได้: {error}</p>}

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
