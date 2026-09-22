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

  // สลับแท็บจากหน้ารายละเอียดสายต้องปิดหน้านั้นไปด้วย ไม่งั้นจะค้างแสดง
  // RouteDetailScreen ต่อ (เพราะ ternary ด้านล่างเช็ค openRoute ก่อนเช็ค tab)
  function selectTab(next: Tab) {
    setOpenRoute(null)
    setTab(next)
  }

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
      <nav className="tabs">
        <button type="button" className={!openRoute && tab === 'stop' ? 'active' : ''} onClick={() => selectTab('stop')}>
          ที่ป้าย
        </button>
        <button
          type="button"
          className={!openRoute && tab === 'destination' ? 'active' : ''}
          onClick={() => selectTab('destination')}
        >
          ไปไหน
        </button>
        <button
          type="button"
          className={!openRoute && tab === 'misboard' ? 'active' : ''}
          onClick={() => selectTab('misboard')}
        >
          ขึ้นผิดคัน
        </button>
      </nav>
    </div>
  )
}

export default App
