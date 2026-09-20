# ที่มาของข้อมูลและสัญญาอนุญาต

โปรเจกต์นี้ใช้ข้อมูลจากสองแหล่งที่อยู่คนละสัญญาอนุญาต เอกสารนี้คือเครดิตตามที่ทั้งสองแหล่งกำหนด
เหตุผลและที่มาของข้อสรุปอยู่ใน [รายงาน WF-012](.wayfinder/research/osm-licence.md)

## ข้อมูลแผนที่พื้นหลัง — ถนน แม่น้ำ ชื่อถนน สถานที่สำคัญ

© ผู้ร่วมสร้าง **OpenStreetMap** — เผยแพร่ภายใต้ **Open Database License (ODbL) 1.0**
<https://www.openstreetmap.org/copyright> · <https://opendatacommons.org/licenses/odbl/1-0/>

**การดัดแปลง**: ดึงผ่าน Overpass API เฉพาะกรอบกรุงเทพฯ และปริมณฑล
(13.5603, 100.3746 ถึง 13.9981, 100.7012) เลือกเฉพาะ `waterway=river`,
`highway` ระดับ motorway/trunk/primary, สถานีรถไฟฟ้าและรถไฟ ห้าง โรงพยาบาล มหาวิทยาลัย
ตลาด และท่าเรือ จากนั้นลดจำนวนจุดด้วย Douglas-Peucker ที่ความคลาดเคลื่อน 30 เมตร
(แม่น้ำ 40 เมตร) ตัดเส้นที่สั้นกว่า 250 เมตรทิ้ง และปัดพิกัดเหลือทศนิยม 4 ตำแหน่ง

ผลลัพธ์คือ **2,570 เส้น + 1,349 จุดชื่อถนน + 1,194 จุดสถานที่**

**ชุดข้อมูลนี้ถือเป็น Derivative Database ตาม ODbL และเผยแพร่ภายใต้ ODbL 1.0 เช่นกัน**
ดาวน์โหลดได้จาก branch `prototype/wf-010-standing-at-the-stop` ที่
`prototypes/wf-010-standing-at-the-stop/index.html` (ฝังอยู่ในตัวแปร `window.BG`)

## ข้อมูลสาย ป้าย และลำดับการเดินรถ

**สำนักงานนโยบายและแผนการขนส่งและจราจร (สนข.)** กระทรวงคมนาคม — ระบบ **Namtang**
เผยแพร่ภายใต้ **Creative Commons Attribution (CC BY) 4.0**
<https://namtang-api.otp.go.th/opendata> · <https://creativecommons.org/licenses/by/4.0/>

**การดัดแปลง**: กรองเหลือเฉพาะผู้ให้บริการ ขสมก. (BMTA) และไทยสมายล์บัส (TSB),
ตัดรายการที่ป้ายต้นทางเป็นป้ายสุดท้ายของสายนั้นออก, ยุบระเบียนซ้ำด้วยคู่
(เลขสาย, ข้อความหน้ารถ, จำนวนป้าย) และลดจำนวนจุดของเส้นทางเหลือไม่เกิน 140 จุดต่อสาย

## ข้อควรระวังที่ผูกกับสัญญาอนุญาต

ข้อมูลสองชุดนี้แยกกันอยู่คนละ **ชนิดของ feature** โดยสิ้นเชิง — ป้ายและสายมาจาก สนข. ทั้งหมด
ส่วนถนน แม่น้ำ และสถานที่มาจาก OSM ทั้งหมด จึงเข้าข่าย **Collective Database** ตาม ODbL §4.5
และ share-alike ของ ODbL **ไม่ลาม**ไปที่ข้อมูลของ สนข.

**การกระทำต่อไปนี้จะทำลายเส้นแบ่งนั้น และดูดชั้นข้อมูลป้ายทั้งชั้นเข้าเป็น Derivative Database ภายใต้ ODbL**

- เอาชื่อสถานที่จาก OSM ไปเติมชื่อป้ายที่ไม่มีชื่อ
- snap พิกัดป้ายเข้ากับแนวถนนของ OSM
- อนุมานฝั่งถนนของป้ายจากข้อมูล OSM (ต้องใช้ `shapes.txt` ของฟีด Namtang เท่านั้น)

## คำปฏิเสธความเกี่ยวข้อง

ทั้ง OpenStreetMap และสำนักงานนโยบายและแผนการขนส่งและจราจร ไม่ได้รับรอง
ไม่ได้สนับสนุน และไม่มีส่วนเกี่ยวข้องกับโปรเจกต์นี้

---

# Data sources and licences (English)

**Background map data** — roads, rivers, road names, landmarks:
© OpenStreetMap contributors, licensed under the [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
See <https://www.openstreetmap.org/copyright>. Extracted via the Overpass API for the Bangkok
area only, filtered to selected feature types, simplified with Douglas-Peucker (30 m tolerance,
40 m for waterways) and rounded to 4 decimal places. **This extract is a Derivative Database
and is itself made available under ODbL 1.0** — it can be downloaded from the
`prototype/wf-010-standing-at-the-stop` branch.

**Bus route, stop and sequence data** — Office of Transport and Traffic Policy and Planning
(OTP), Ministry of Transport, Thailand, via the Namtang system, licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See <https://namtang-api.otp.go.th/opendata>.
Modified: filtered to BMTA and Thai Smile Bus operators, terminating runs removed, duplicate
records collapsed, route geometry decimated to at most 140 points per route.

Neither OpenStreetMap nor OTP endorses or is affiliated with this project.
