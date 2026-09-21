import { useState } from 'react'
import { DestinationScreen } from './components/DestinationScreen'
import { MisboardScreen } from './components/MisboardScreen'
import { RouteDetailScreen } from './components/RouteDetailScreen'
import { StopScreen } from './components/StopScreen'
import type { BoardableDirection } from './lib/routeLookup'
import { useBusData } from './lib/useBusData'
import { useGeolocation } from './lib/useGeolocation'

type Tab = 'stop' | 'destination' | 'misboard'

function App() {
  const { data, error } = useBusData()
  const [tab, setTab] = useState<Tab>('stop')
  const [openRoute, setOpenRoute] = useState<BoardableDirection | null>(null)
  const location = useGeolocation()

  if (error) return <p className="status error">โหลดข้อมูลรถเมล์ไม่ได้: {error}</p>
  if (!data) return <p className="status">กำลังโหลดข้อมูลรถเมล์...</p>

  return (
    <div className="app">
      <main>
        {openRoute ? (
          <RouteDetailScreen data={data} boardable={openRoute} onBack={() => setOpenRoute(null)} />
        ) : (
          <>
            {tab === 'stop' && <StopScreen data={data} location={location} onOpenRoute={setOpenRoute} />}
            {tab === 'destination' && <DestinationScreen data={data} location={location} />}
            {tab === 'misboard' && <MisboardScreen data={data} location={location} />}
          </>
        )}
      </main>
      {!openRoute && (
        <nav className="tabs">
          <button type="button" className={tab === 'stop' ? 'active' : ''} onClick={() => setTab('stop')}>
            ที่ป้าย
          </button>
          <button
            type="button"
            className={tab === 'destination' ? 'active' : ''}
            onClick={() => setTab('destination')}
          >
            ไปไหน
          </button>
          <button type="button" className={tab === 'misboard' ? 'active' : ''} onClick={() => setTab('misboard')}>
            ขึ้นผิดคัน
          </button>
        </nav>
      )}
    </div>
  )
}

export default App
