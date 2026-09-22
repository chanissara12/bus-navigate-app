import { useEffect, useState } from 'react'

const AUTO_HIDE_MS = 5000

export function MapAttribution() {
  // ต้องแสดงเครดิตตามสัญญาอนุญาต ODbL/CC-BY ของแหล่งข้อมูล แต่ให้ซ่อนอัตโนมัติหลัง
  // AUTO_HIDE_MS เพื่อไม่ให้บังแผนที่ตลอดเวลา — ผู้ใช้กดปุ่ม ⓘ เพื่อเปิดดูซ้ำได้
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => setVisible(false), AUTO_HIDE_MS)
    return () => clearTimeout(timer)
  }, [visible])

  if (!visible) {
    return (
      <button
        type="button"
        className="attribution-reopen"
        aria-label="แสดงเครดิตแผนที่"
        onClick={() => setVisible(true)}
      >
        ⓘ
      </button>
    )
  }

  return (
    <div className="attribution-banner">
      <span>
        แผนที่จาก © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> ผู้ร่วมเขียน (ODbL) ·
        ข้อมูลสายรถเมล์จาก สนข. (CC-BY 4.0) — กรองเฉพาะ ขสมก.+TSB และรวมระเบียนซ้ำ
      </span>
      <button type="button" aria-label="ปิด" onClick={() => setVisible(false)}>
        ✕
      </button>
    </div>
  )
}
