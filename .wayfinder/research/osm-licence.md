---
id: WF-012-research
title: OSM/ODbL กับการอบข้อมูลลงแอป Namtang — รายงานการค้นคว้า
label: wayfinder:research
status: done
---

# OSM ODbL กับการอบข้อมูลลงในแอป

เคสที่วิเคราะห์: extract จาก Overpass ที่อบลง bundle — **เส้นถนน/แม่น้ำ 2,570 เส้น (simplify ด้วย Douglas-Peucker), จุดชื่อถนน 1,349 จุด, จุดสถานที่สำคัญ 1,194 จุด** เก็บเป็น JSON ในแอป คู่กับข้อมูลสาย/ป้ายจากฟีด Namtang (CC-BY) และน่าจะ deploy เป็น PWA บน URL สาธารณะ ใช้คนเดียว

> **นี่ไม่ใช่คำแนะนำทางกฎหมาย** เป็นการรวบรวมว่าตัวสัญญาอนุญาตและแนวปฏิบัติทางการของ OSMF เขียนไว้ว่ายังไง และชี้จุดที่ต้องถามทนายจริงๆ

---

## Bottom line

- **extract ชุดนี้คือ Derivative Database ไม่ใช่ Produced Work** — ถนน 2,570 เส้นเป็นการดึงแบบ Substantial ชัดเจน (เกณฑ์ OSMF คือ "village map OK, town map not OK") และการ simplify + แปลงเป็น JSON ถูกจัดเป็น *trivial transformation* ซึ่ง **ไม่เปลี่ยนฐานข้อมูลให้กลายเป็น Produced Work** ส่วน Produced Work ตามแนวปฏิบัติคือผลลัพธ์แบบ PNG/JPG/PDF/SVG ที่ไม่ได้ตั้งใจให้ดึงข้อมูลกลับ — JSON พิกัด+ชื่อ ดึงกลับได้ตรงๆ
- **แต่ราคาของการทำตามแทบเป็นศูนย์** — ภาระที่ตามมาคือ (ก) เปิด JSON ชุดนั้นภายใต้ ODbL (ข) มีลิงก์ให้โหลดไฟล์ในรูปแบบ machine-readable (ค) ติดเครดิต ซึ่งไฟล์มันอยู่ใน bundle ที่ใครเปิด devtools ก็โหลดได้อยู่แล้ว **ใส่ลิงก์หนึ่งลิงก์กับย่อหน้าหนึ่งย่อหน้าก็จบ** ไม่ต้องเปลี่ยนสถาปัตยกรรม
- **ข้อมูล Namtang ไม่ติด share-alike** ตราบใดที่ไม่เอา OSM มาปนใน feature type เดียวกัน — ตอนนี้ป้าย/สายมาจาก Namtang 100% ถนน/แม่น้ำ/สถานที่มาจาก OSM 100% จึงเข้าข่าย **Collective Database** ตาม Horizontal Map Layers Guideline และ ODbL §4.5 **ตัวจุดชนวนคือถ้าวันไหนเอา OSM ไปเติมชื่อป้ายหรือ snap พิกัดป้าย** (แบบที่ WF-005 เคยคิด) ชั้นป้ายจะถูกดูดเข้าเป็น Derivative Database ทันที — **ห้ามทำ**
- **PWA บน URL สาธารณะ = การแจกจ่าย** แม้มีผู้ใช้คนเดียว เพราะ ODbL นิยาม Convey ว่า "enables a Person to make or receive copies" และ Publicly คือ "to Persons other than You" — ถ้าอยากไม่ติดภาระเลยต้องไม่ให้คนนอกเข้าถึง (localhost/LAN หรือใส่ auth หน้าเว็บ) แต่เทียบราคาแล้ว **ทำตามแล้ว deploy เลยคุ้มกว่า**
- **ไม่มีแหล่งทดแทนที่ใช้ได้จริงในระดับเมือง** — Overture ชั้นถนนก็เป็น ODbL เพราะมาจาก OSM, Daylight ก็ ODbL, Natural Earth หยาบเกินไป (1:10m), RTSD ไม่ใช่ open data, ทางหลวงชนบทบน data.go.th ไม่มีซอย **ชั้นเดียวที่สลับเป็นสัญญาอนุญาตหลวมกว่าได้จริงคือจุดสถานที่ 1,194 จุด → Overture Places (CDLA-Permissive-2.0)** แต่ถ้าถนนยังเป็น OSM อยู่ก็ไม่ได้ลดภาระอะไร

---

## 1. Derivative Database หรือ Produced Work

### ตัวบท ODbL ที่เกี่ยวข้อง

นิยามใน §1 (opendatacommons.org/licenses/odbl/1-0/):

- **Derivative Database** — "A database based upon the Database, and includes any translation, adaptation, arrangement, modification, or any other alteration of the Database **or of a Substantial part of the Contents**."
- **Produced Work** — "A work (**such as an image, audiovisual material, text, or sounds**) resulting from using the whole or a Substantial part of the Contents via a search or other query from this Database."
- **Extraction** — "The permanent or temporary transfer of all or a Substantial part of the Contents to another medium by any means or in any form."
- **Substantial** — "Substantial in terms of quantity or quality or a combination of both."

### ขั้นที่ 1 — Substantial ไหม: ใช่ ไม่ต้องเถียง

[Substantial - Guideline](https://osmfoundation.org/wiki/Licence/Community_Guidelines/Substantial_-_Guideline) ให้เกณฑ์เชิงปริมาณไว้:

- **ต่ำกว่า 100 features** → insubstantial อัตโนมัติ
- **ตั้งแต่ 100 ขึ้นไป** → insubstantial ได้ก็ต่อเมื่อ "non-systematic and clearly based on your own qualitative criteria" (ตัวอย่างที่ยกคือ "ร้านอาหารที่ฉันเคยไปกินเอง")
- เกณฑ์เชิงพื้นที่: "the features relating to an area of up to 1,000 inhabitants"
- การดึงย่อยๆ ซ้ำๆ ให้นับรวมกันเป็นก้อนเดียว
- สรุปแบบชาวบ้านของ guideline เอง: **"village map OK, town map not OK"**

เคสนี้คือ **~5,113 features** ดึงแบบ systematic ทั้งหมด (ถนนทุกเส้นในกรอบ, สถานที่ทุกอันในหมวดที่เลือก) ครอบคลุมกรุงเทพฯ ซึ่งมีประชากรหลักล้าน → **Substantial เต็มๆ** ไม่มีช่องให้อ้าง insubstantial exemption

### ขั้นที่ 2 — การ simplify ทำให้กลายเป็นของใหม่ไหม: ไม่

[Trivial Transformations - Guideline](https://osmfoundation.org/wiki/Licence/Community_Guidelines/Trivial_Transformations_-_Guideline) ระบุชัดว่าสิ่งต่อไปนี้เป็น *trivial transformation*:

- การแปลงฟอร์แมต (XML → JSON → ฐานข้อมูล)
- การเปลี่ยนระบบพิกัด
- การกรองด้วย bounding box หรือ tag
- **การ simplify เรขาคณิต (geometric simplifications)** ← Douglas-Peucker อยู่ตรงนี้
- การวางตำแหน่ง label/icon อัตโนมัติ ← จุดชื่อถนน 1,349 จุด อยู่ตรงนี้

"Purely algorithmic augmentation of data and re-casting of data to use, store or transmit it in different manners is a 'trivial transformation'" — **โดยมีเงื่อนไขว่าไม่มีข้อมูลจากแหล่งอื่นเข้ามาผสม** และผลของ trivial transformation คือ **ยังเป็นฐานข้อมูลอยู่** ต้อง "publish the result under ODbL in a format that can be read by the public" ถ้ามีการแก้ไข/เพิ่มเติมข้อมูล

**สรุปขั้นนี้: Douglas-Peucker ไม่ใช่การฟอกใบอนุญาต** การทำให้เส้นหยาบลงไม่ได้เปลี่ยนสถานะทางสัญญาอนุญาต

### ขั้นที่ 3 — เทสต์ Produced Work

[Produced Work - Guideline](https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline) ให้เกณฑ์ตัดสินประโยคเดียว:

> "**If the published result of your project is intended for the extraction of the original data, then it is a database and not a Produced Work. Otherwise it is a Produced Work.**"

ตัวอย่างที่ guideline บอกว่าเป็น Produced Work: **PNG, JPG, PDF, SVG** และแผนที่ที่พิมพ์ลงกระดาษ — คือ raster/ภาพ ส่วน database dump (เช่น planet dump) "usually not Produced Works"

เอาเกณฑ์นี้มาจับเคสนี้:

| ลักษณะของ extract | ชี้ไปทาง |
|---|---|
| เก็บเป็น JSON มีพิกัดกับชื่อเป็นฟิลด์ | Database |
| แอปอ่านกลับเข้าหน่วยความจำเพื่อเรนเดอร์ = ข้อมูลยังอยู่ในรูปที่ดึงกลับได้ 100% | Database |
| ใครก็ตามที่เปิดไฟล์ได้ ได้ข้อมูลต้นฉบับ (แบบ simplify) กลับไปครบ | Database |
| จุดสถานที่ 1,194 จุด มีชื่อติดมา = ใช้เป็น gazetteer/ค้นหาได้ | Database |
| ไม่ได้ถูกแรสเตอร์เป็นภาพเลย | ไม่ใช่ Produced Work |

**ข้อสรุป: Derivative Database** — ถ้าต้องเดิมพัน เดิมพันข้างนี้

### จุดที่คลุมเครือจริงๆ (พูดตรงๆ)

แนวปฏิบัติของ OSMF เขียนไว้ตอนที่โลกยังเป็น raster tile ช่อง "Examples" ของ Produced Work Guideline **ว่างเปล่า ("None")** และ **ไม่มีตรงไหนพูดถึง vector data ที่อยู่ในแอปเลย** ชุมชน OSM เถียงเรื่อง vector tile มาหลายปีโดยไม่มีข้อยุติทางการ

ข้อมูลที่เถียงอีกฝั่ง: **Protomaps แจก basemap ของตัวเองโดยเรียกมันว่า "an Open Database License Produced Work"** ทั้งที่มันคือ PMTiles ที่เป็น vector — นี่คือหลักฐานว่ามีโปรเจกต์ใหญ่ที่ตีความว่า vector tile = Produced Work

แต่ **extract ของเราอยู่ไกลจาก vector tile ไปทางฝั่งฐานข้อมูลมากกว่า** — ไม่ได้อยู่ในฟอร์แมต tile, ไม่ได้ถูกจัดเรียงเพื่อการเรนเดอร์โดยเฉพาะ, เป็น JSON ธรรมดาที่มีชื่อสถานที่เป็นฟิลด์ ฉะนั้น argument ของ Protomaps ใช้กับเราไม่ค่อยได้

**ค่าตั้งต้นที่ปลอดภัย: ถือว่าเป็น Derivative Database** เพราะต้นทุนการทำตามต่ำมาก การไปเดิมพันฝั่ง Produced Work ได้กำไรน้อยกว่าความเสี่ยงเยอะ

### ถ้าเป็น Derivative Database แล้วต้องทำอะไรบ้าง

จาก ODbL (ผูกเฉพาะเมื่อ "Publicly Use" — ดูข้อ 3):

- **§4.4 Share Alike** — "Any Derivative Database that You Publicly Use must be only under the terms of: This License; A later version...; or A compatible license." → ไฟล์ JSON ชุดนั้นต้องอยู่ใต้ ODbL
- **§4.6 Access Requirement** — ต้อง "offer to recipients...a copy in a machine readable form of: The entire Derivative Database; or A file containing all of the alterations made" → **มีลิงก์ดาวน์โหลด JSON ชุดนั้นตรงๆ** (ซึ่งมันอยู่ใน bundle อยู่แล้ว ใส่ลิงก์ไปที่ path เดิมได้เลย)
- **§4.3 Notice** — ต้องมีประกาศที่ "reasonably calculated to make any Person...aware that Content was obtained from the Database...and that it is available under this License"
- **§4.7 No DRM** — ห้ามใส่มาตรการทางเทคนิคที่ไปจำกัดสิทธิตามสัญญานี้ (ไม่กระทบเคสนี้ เพราะ JSON เปิดอ่านได้อยู่แล้ว)

**เช็กลิสต์ที่ทำได้ใน 20 นาที:**
1. วางไฟล์ `LICENSE-osm.txt` หรือฟิลด์ `"license"` ใน JSON ระบุ ODbL + ที่มา
2. ในหน้า About ใส่ลิงก์ "ดาวน์โหลดข้อมูลแผนที่ (ODbL)" ชี้ไปที่ไฟล์ JSON ใน bundle
3. เขียนสคริปต์ Overpass ที่ใช้ดึงไว้ในลิงก์เดียวกัน (ไม่บังคับ แต่ตอบ §4.6 ได้แน่นอนที่สุด)
4. เครดิตตามข้อ 2 ข้างล่าง

---

## 2. เครดิตที่ต้องมี — ข้อความและตำแหน่ง

### OSM: ข้อความ

[Attribution Guidelines ของ OSMF](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines) ระบุ (ยกมาตรง):

> "Attribution must be to 'OpenStreetMap.' Attribution must also make it clear that the data is available under the Open Database License. This may be done by making the text 'OpenStreetMap' a link to openstreetmap.org/copyright... OSM does not wish to claim credit for data or other material that did not come from it, so feel free to qualify the credit to explain what OSM content you are using. For example, if you have rendered OSM data to your own design, you may wish to use **'Map data from OpenStreetMap.'** The historical forms of attribution **'© OpenStreetMap contributors'** or '© OpenStreetMap' are acceptable."

→ เคสนี้เรนเดอร์เองจาก extract ของตัวเอง ฉะนั้น **"ข้อมูลแผนที่จาก OpenStreetMap"** (ลิงก์ไป openstreetmap.org/copyright) ตรงที่สุด

### OSM: ตำแหน่ง — ต้องอยู่บนแผนที่ ไม่ใช่แค่หน้า About

มาตรฐานคือ "reasonably calculated to make any Person that uses, views, accesses, interacts with, or is otherwise exposed to the Produced Work aware..."

สิ่งที่ guideline **อนุญาต**:
- มุมไหนของแผนที่ก็ได้ (มุมขวาล่างเป็นธรรมเนียม)
- วางข้างแผนที่ หรือใน splash screen / pop-up ตอนเปิดแอป
- **ยุบ/จางได้** ใน 3 กรณี: ผู้ใช้กดปิด (เช่นกด "x"), ยุบอัตโนมัติเมื่อมี interaction กับแผนที่ (pan/zoom/click), หรือยุบอัตโนมัติหลัง **5 วินาที**
- แต่ถ้ายุบแล้ว **ต้องยังมีปุ่ม info หรือเมนูให้กดกลับไปเจอข้อมูลสัญญาอนุญาตได้**

**คำตอบตรงคำถามในตั๋ว: หน้า About อย่างเดียวไม่พอ** ต้องมีบนหน้าจอแผนที่ด้วย แต่ไม่ต้องกินที่ถาวร — เอา `ⓘ` มุมล่างขวาของแผนที่ที่กดแล้วเปิด credits ก็เข้าเกณฑ์ หรือขึ้นข้อความเต็ม 5 วินาทีแล้วยุบเป็นไอคอน

หน้าจอที่กระทบ: **แผนที่เส้นทาง + ลำดับป้าย** ของ WF-010 (หน้าจอหลักที่เป็นรายการสายไม่มีแผนที่ ไม่ต้องติดตรงนั้น แต่ credits ในหน้า About ควรมีอยู่ดี)

### OSM: เครดิตในฐานะ "ฐานข้อมูล" (เพิ่มจากข้างบน)

เพราะเราสรุปว่ามันเป็น Derivative Database ด้วย guideline ระบุว่าสำหรับฐานข้อมูล เครดิต + ข้อความ ODbL ต้องอยู่ "as part of the database, derivative database, or database as part of a collective database" เช่นในไฟล์ README หรือ metadata ที่คนจะไปหา → **ใส่ฟิลด์ใน JSON เองหรือไฟล์ LICENSE ข้างๆ**

### สนข. (CC-BY)

CC BY 4.0 §3(a) ต้องการ: ชื่อผู้สร้าง, ชื่องาน, ลิงก์สัญญาอนุญาต, และ **ระบุว่ามีการดัดแปลง** — ข้อสุดท้ายสำคัญเพราะ WF-006 กรองเหลือ ขสมก.+TSB และ WF-010 ยุบระเบียนซ้ำ = ดัดแปลงแล้ว

### รวมสองแหล่งในแอปเดียว

OSMF บอกให้ระบุชัดว่าอะไรมาจากไหน ("qualify the credit") ซึ่งพอดีกับเคสนี้ที่ซ้อนสองแหล่ง

**บนแผนที่ (บรรทัดสั้น):**
```
ข้อมูลแผนที่จาก OpenStreetMap · ข้อมูลรถเมล์จาก สนข.   ⓘ
```

**ในหน้า About / credits (เต็ม):**
```
ข้อมูลแผนที่พื้นหลัง (ถนน แม่น้ำ ชื่อถนน สถานที่สำคัญ)
  © ผู้ร่วมสร้าง OpenStreetMap — เผยแพร่ภายใต้ ODbL 1.0
  https://www.openstreetmap.org/copyright
  ข้อมูลชุดนี้ถูกตัดเฉพาะพื้นที่กรุงเทพฯ และลดจุดด้วย Douglas-Peucker
  ดาวน์โหลดข้อมูลที่ใช้จริง (ODbL): <ลิงก์ไฟล์ JSON>

ข้อมูลสาย ป้าย และลำดับการเดินรถ
  สำนักงานนโยบายและแผนการขนส่งและจราจร (สนข.) — ระบบ Namtang
  เผยแพร่ภายใต้ CC BY 4.0
  https://namtang-api.otp.go.th/opendata
  ดัดแปลง: กรองเฉพาะผู้ให้บริการ ขสมก. และ TSB และยุบระเบียนซ้ำ

ทั้ง OpenStreetMap และ สนข. ไม่ได้รับรองหรือมีส่วนเกี่ยวข้องกับแอปนี้
```

### กับดักที่ต้องระวัง — Horizontal Map Layers

[Horizontal Map Layers - Guideline](https://osmfoundation.org/wiki/Licence/Community_Guidelines/Horizontal_Map_Layers_-_Guideline) บอกว่าตัวจุดชนวน share-alike คือ **feature type** ไม่ใช่ layer:

> "if all data for that Feature Type is from non-OpenStreetMap sources, then the ODbL share-alike conditions do not apply" / "If you use OpenStreetMap data along with non-OpenStreetMap data for a given Feature Type, then the share-alike condition would apply."

สถานะปัจจุบันของแอป: ป้าย/สาย = Namtang 100%, ถนน/แม่น้ำ/ชื่อถนน/สถานที่ = OSM 100% → **ไม่มี feature type ไหนปน** จึงเป็น Collective Database ซึ่ง ODbL §4.5 ยกเว้น share-alike ให้ (`4.5 Limits of Share Alike` ไม่ใช้กับ Collective Databases) **แปลว่าข้อมูล Namtang ไม่ติด ODbL**

**สิ่งที่จะทำลายสถานะนี้ทันที:**
- เอาชื่อสถานที่จาก OSM ไปเติมชื่อป้ายที่ว่าง (แนวที่ WF-005 สำรวจไว้ — โชคดีที่ตกรอบไปแล้วเพราะได้แค่ 1.5%)
- snap พิกัดป้ายเข้ากับเส้นถนนของ OSM (WF-003 ใช้ `shapes.txt` จากฟีดอยู่แล้ว — **ห้ามเปลี่ยนไปใช้ OSM**)
- เอา OSM มาช่วยตัดสินว่าป้ายอยู่ฝั่งไหนของถนน
- เอาชื่อ landmark จาก OSM มาทำ alias ให้ปลายทางที่ผู้ใช้บันทึก **ถ้า** alias นั้นถูกเก็บลงในเรคอร์ดของป้าย

ถ้าทำอย่างใดอย่างหนึ่ง ชั้นป้ายทั้งชั้นกลายเป็น Derivative Database และต้องเปิดใต้ ODbL ด้วย — ซึ่งอาจขัดกับเงื่อนไข CC-BY ของ สนข. ในเชิงปฏิบัติ (CC-BY ไม่ห้ามการ relicense ต่อแบบนี้โดยตรง แต่ทำให้เรื่องยุ่งโดยไม่จำเป็น)

---

## 3. ใช้คนเดียว / deploy ขึ้นเว็บ นับเป็นการแจกจ่ายไหม

### ODbL ผูกกับอะไร

ภาระหลักผูกกับคำว่า **Publicly Use / Convey / Re-utilisation** ไม่ใช่การ "ใช้":

- **Publicly** — "To Persons other than You or under Your control by either more than 50% ownership or by the power to direct their activities"
- **Convey** — "Using the Database, a Derivative Database, or the Database as part of a Collective Database **in any way that enables a Person to make or receive copies**"
- **Re-utilisation** — "Any form of making available to the public all or a Substantial part of the Contents by the distribution of copies, by renting, **by online or other forms of transmission**"
- §4.4 เขียนว่า "Any Derivative Database that **You Publicly Use**..." และ §4.5 ยกเว้นการใช้ภายในองค์กรออกไป

### กรณี A — ไม่ deploy เลย (localhost / เครื่องตัวเอง)

**ไม่มีภาระ share-alike และไม่มีภาระ attribution ตามตัวบท** เพราะไม่มี Public Use ไม่มี Convey — ข้อมูลไม่เคยออกจากการควบคุมของคุณ (ยังคงอยู่ในกรอบ "Persons...under Your control")

### กรณี B — PWA บน URL สาธารณะ ใช้คนเดียว ← **เคสจริง**

**นับเป็นการแจกจ่าย** ด้วยเหตุผลสองชั้น:

1. **Convey** — เว็บเซิร์ฟเวอร์สาธารณะ "enables a Person to make or receive copies" ตามนิยามตรงๆ ใครพิมพ์ URL ถูกก็โหลดไฟล์ JSON ได้
2. **PWA offline-first ยิ่งชัดกว่าเว็บทั่วไป** — service worker **คัดลอกไฟล์ลง Cache Storage ของเครื่องผู้เยี่ยมชม** ตามดีไซน์ นั่นคือการทำสำเนาไปไว้บนเครื่องคนอื่นแบบตั้งใจ ซึ่งเข้านิยาม Re-utilisation "by online or other forms of transmission" เต็มๆ

**จำนวนผู้ใช้จริงไม่อยู่ในนิยามเลย** — ODbL วัดที่ "เข้าถึงได้โดยบุคคลอื่นหรือไม่" ไม่ได้วัดที่ "มีคนเข้ากี่คน" การที่ไม่มีใครรู้ URL ไม่ใช่ข้อยกเว้นที่เขียนไว้ที่ไหน

**จุดที่คลุมเครือจริง:** URL สาธารณะที่ไม่มีใครลิงก์ถึงและเดาไม่ได้ อยู่ตรงไหนของเส้น — ไม่มีคำตอบในตัวบท และไม่มีคดี **ค่าตั้งต้นที่ปลอดภัย: ถือว่า URL สาธารณะ = แจกจ่าย**

### ทางเลือกถ้าอยากไม่ติดภาระจริงๆ

- รันบน localhost หรือใน LAN บ้าน (PWA install ได้จาก `http://localhost` อยู่แล้ว)
- ใส่ HTTP Basic Auth / Cloudflare Access หน้าเว็บ ให้เข้าถึงได้เฉพาะตัวเอง
- **หมายเหตุ:** การใส่ auth ตอนที่ไม่ได้แจกจ่าย **ไม่ขัด §4.7 (anti-DRM)** เพราะ §4.7 ผูกกับการ convey ถ้าไม่ convey ก็ไม่มีอะไรให้จำกัด

### แต่คำแนะนำคือ: อย่าเลี่ยง

ภาระทั้งหมดของเคสนี้คือ **ลิงก์ดาวน์โหลด 1 ลิงก์ + บรรทัดเครดิต 1 บรรทัด + หน้า credits 1 หน้า** ส่วนการเลี่ยงต้องแลกกับ deploy pipeline ที่ยุ่งขึ้นและใช้งานข้ามเครื่องไม่ได้ — **ทำตามแล้ว deploy เป็น public URL ตามเดิม คุ้มกว่าชัดเจน**

---

## 4. แหล่งข้อมูลทางเลือกที่สัญญาอนุญาตหลวมกว่า

| แหล่ง | สัญญาอนุญาต | ใช้ได้ระดับเมืองไหม | สรุป |
|---|---|---|---|
| **Overture — transportation / base / divisions / buildings** | **ODbL** | ได้ | ❌ ไม่หนี ODbL เพราะ derive จาก OSM ("© OpenStreetMap contributors" required) |
| **Overture — places** | **CDLA-Permissive-2.0** (บางส่วน Apache-2.0 / CC0) | ได้ | ✅ **ทางเลือกจริงชั้นเดียวในรายงานนี้** สำหรับสถานที่ 1,194 จุด |
| **Daylight Map Distribution (Meta)** | **ODbL** | ได้ | ❌ เป็นการแจกซ้ำ OSM ที่ผ่าน QA — ได้คุณภาพ ไม่ได้สัญญาอนุญาต |
| **Natural Earth** | Public domain (ใช้ได้ไม่ต้องขอ) | **ไม่ได้** | ❌ สเกล 1:10m — เห็นเจ้าพระยาเป็นเส้นเดียว ไม่มีซอย ไม่มีคลอง ไร้ประโยชน์กับ "เห็นสถานที่ใกล้เคียง" |
| **ทางหลวงชนบท (data.go.th)** | DGA Open Government License | บางส่วน | ⚠️ ชั้น "เส้นทางหลวงชนบท" 1:20000 ปี 2558 — เป็นถนนสายหลัก/ชนบท **ไม่มีโครงข่ายถนนในเมืองและซอย** ซึ่งเป็นสิ่งที่แอปต้องใช้ |
| **กรมทางหลวง (ทล.)** | ราชการ/DGA license | บางส่วน | ⚠️ ทางหลวงแผ่นดินเท่านั้น ในกรุงเทพฯ แทบไม่ครอบคลุมถนนที่รถเมล์วิ่ง |
| **กรมแผนที่ทหาร (RTSD)** | สงวนลิขสิทธิ์ ไม่ใช่ open data | ได้ (1:50,000) | ❌ แผนที่ L7018 ขายเป็นระวาง ไม่มีสัญญาอนุญาตให้แจกจ่ายต่อในแอป |
| **แม่น้ำ/คลอง กรุงเทพฯ** | — | — | ❌ ไม่มีแหล่ง permissive ที่ความหนาแน่นเทียบ OSM ได้ |

### ข้อสรุปข้อ 4

**สำหรับถนน + แม่น้ำ ระดับเมืองในกรุงเทพฯ OSM คือทางเลือกเดียวที่ใช้ได้จริง** — "ทางเลี่ยง" ที่ตั๋วถามหาไม่มีอยู่จริงในทางปฏิบัติ ทางออกที่ถูกต้องไม่ใช่การหาแหล่งอื่น แต่คือการทำตาม ODbL ซึ่งราคาถูกมาก

**ชั้นสถานที่สำคัญ (1,194 จุด) เปลี่ยนไปใช้ Overture Places ได้จริง** (CDLA-Permissive-2.0 ไม่มี share-alike) แต่ **ถ้าถนนยังเป็น OSM อยู่ ก็ยังต้องทำตาม ODbL อยู่ดี** ฉะนั้นการสลับชั้นนี้ไม่ได้ลดภาระ — ทำก็ต่อเมื่อเจอว่า Overture Places ครอบคลุมห้าง/โรงพยาบาล/มหาวิทยาลัยในกรุงเทพฯ **ดีกว่า** OSM เท่านั้น (เหตุผลด้านคุณภาพ ไม่ใช่ด้านสัญญาอนุญาต)

⚠️ **ถ้าเปลี่ยนไปใช้ Overture Places คู่กับถนน OSM ต้องระวัง Horizontal Layers อีกรอบ** — คนละ feature type กันจึงยังโอเค แต่ห้ามเอา OSM มาเติมจุดที่ Overture ขาด มิฉะนั้น feature type "สถานที่" จะปนและติด share-alike

---

## 5. ถ้าใช้ tile ออนไลน์แทน — ใครยอมให้แคชออฟไลน์

> หมายเหตุ: WF-010 ตัดสินไปแล้วว่า **ใช้แผนที่ออฟไลน์อย่างเดียว ไม่ทำโหมดออนไลน์** ข้อนี้จึงเป็นการตรวจว่าถ้ากลับคำจะเจออะไร — และคำตอบคือเจอทางตันเกือบทุกเจ้า ซึ่งยืนยันว่า WF-010 ตัดสินถูก

| ผู้ให้บริการ | แคชออฟไลน์ได้ไหม | ราคา/ระดับที่ได้ | หลักฐาน |
|---|---|---|---|
| **tile.openstreetmap.org** | ❌ **ห้ามชัดเจน** | ฟรี แต่ห้าม | "Offline use is not permitted on tile.openstreetmap.org. Features such as 'Download city/country for offline use'...are therefore prohibited." + ห้าม bulk downloading = "any pre-emptive fetching of tiles other than those a user is actively viewing" (แคชตาม HTTP header อย่างน้อย 7 วันได้ แต่นั่นคือแคชปกติ ไม่ใช่การ seed) |
| **Protomaps** | ✅ **ได้เต็มที่** | **ฟรี — โฮสต์เอง** | แจก planet/area extract เป็น PMTiles ให้โหลด และ**แนะนำเองให้ "copy the tileset to your own Cloud Storage"** แทนการ hotlink → ไม่มี ToS ของผู้ให้บริการเพราะคุณเป็นผู้ให้บริการเอง เหลือแค่ ODbL (เขาเรียก basemap ตัวเองว่า "an ODbL Produced Work") |
| **Stadia Maps** | ✅ **ได้ มีเขียนไว้ชัด แต่จำกัด** | free tier = non-commercial เท่านั้น (พอดีกับแอปส่วนตัว) | ห้าม bulk download "except for the purpose of caching small amounts of data for offline use in a mobile application, **not to exceed 100MB cached at a time per device**" — ห้าม server-side cache เด็ดขาด ⚠️ คำว่า "mobile application" ไม่ชัดว่าครอบคลุม PWA ที่เก็บใน Cache Storage หรือไม่ |
| **MapTiler Cloud** | ❌ บนแพลน cloud ไม่ได้ | ต้องคุยสัญญาแยก | "Results of requests can be stored in a temporary personal cache (browser cache, mobile app cache, etc.) for use by a single end-user only" แต่ "prohibited to batch or excessive bulk download of map tiles" → แคชชั่วคราวได้ **seed พื้นที่ไว้ล่วงหน้าไม่ได้** ทางออกออฟไลน์คือซื้อ MapTiler Server / Data แยก (เงื่อนไขอยู่ในเอกสารคนละฉบับ ไม่ได้อ่าน) |
| **Mapbox** | ⚠️ ได้เฉพาะ native SDK ไม่ใช่ PWA | ต้องมีแพลนแบบ MAU | Mobile Maps SDK มี offline region: เพดานเริ่มต้น **6,000 tiles ต่อ end user** และ tile pack ไม่เกิน **750** แต่ ToS ห้ามแจกจ่ายต่อ offline map ที่โหลดมา — **Mapbox GL JS / PWA ไม่มีเส้นทาง offline download ที่รองรับ** |
| **Google Maps** | ❌ **ไม่ได้ทุกระดับราคา** | ไม่มีทาง | ห้ามแคช Maps Content ยกเว้นข้อยกเว้นแคบๆ: **place ID เก็บได้ไม่จำกัด, พิกัด lat/lng แคชได้ไม่เกิน 30 วันปฏิทินติดต่อกัน แล้วต้องลบ** ไม่มี offline tile ในทุกแพลน (กระทบ WF-002 ด้วย: ถ้าเก็บ `headway` จาก Directions API ต้องอยู่ในกรอบนี้) |

### ข้อสรุปข้อ 5

- **เจ้าเดียวที่ทั้งออฟไลน์ได้และไม่ติด ToS ของใครเลยคือ Protomaps (โฮสต์เอง)** — และมันพาเรากลับมาที่คำถามข้อ 1 อีกรอบ เพราะข้อมูลข้างในก็คือ OSM
- **Stadia Maps คือเจ้าเดียวในเชิงพาณิชย์ที่เขียนอนุญาตออฟไลน์ไว้เป็นลายลักษณ์อักษร** (100MB/เครื่อง) — free tier non-commercial พอดีกับแอปส่วนตัว แต่ถ้อยคำ "mobile application" ต้องถามเขาเองว่าครอบคลุม PWA ไหม
- **OSM tile server ฟรีเป็นทางตัน** สำหรับ use case นี้ ห้ามตรงๆ
- **สิ่งที่แอปทำอยู่ตอนนี้ (อบ JSON 240 KB เอง) ไม่มีปัญหา ToS กับใครเลย** เหลือแค่เช็กลิสต์ ODbL ในข้อ 1 — **นี่คือทางที่สะอาดที่สุดในบรรดาทั้งหมด**

---

## Confidence and gaps

### มั่นใจสูง (อ่านตัวบท/แนวปฏิบัติทางการโดยตรง)

- ตัวบท ODbL 1.0 นิยามและ §4.3–4.7 — จาก opendatacommons.org
- เกณฑ์ Substantial (100 features / 1,000 ประชากร / "village map OK, town map not OK") — Substantial Guideline
- การ simplify/แปลงฟอร์แมต = trivial transformation ไม่เปลี่ยนสถานะ — Trivial Transformations Guideline
- เกณฑ์ feature type ของ Horizontal Map Layers Guideline
- ข้อความและตำแหน่งเครดิต รวมถึงกฎยุบหลัง 5 วินาที — Attribution Guidelines
- นโยบาย tile ของ OSMF, เงื่อนไข Stadia 100MB, กฎ 30 วันของ Google, สัญญาอนุญาตรายธีมของ Overture, การแจก PMTiles ของ Protomaps
- Natural Earth หยาบเกินไปสำหรับระดับเมือง

### มั่นใจปานกลาง (ตีความ ไม่ใช่การอ้างตัวบทตรง)

- **การจัด extract นี้เป็น Derivative Database** — OSMF ไม่เคยเขียนถึง vector data ในแอปเลย ช่อง Examples ของ Produced Work Guideline ว่างเปล่า และ Protomaps ตีความฝั่งตรงข้ามกับข้อมูลที่คล้ายกัน **ค่าตั้งต้นที่ปลอดภัยคือถือว่าเป็น Derivative Database แล้วทำตาม ซึ่งถูกมากจนไม่ต้องเสี่ยง**
- **PWA public URL = conveying** — อ่านจากนิยามตรงๆ แต่ไม่มีคดีหรือคำอธิบายทางการของ OSMF ยืนยัน
- **สถานะ Collective Database ของการรวม Namtang + OSM** — ถูกต้องตราบที่ feature type ไม่ปน ซึ่งตอนนี้จริง แต่เปราะ

### ยังไม่ได้ตรวจ / ช่องว่าง

- **ตัวบท DGA Open Government License** — data.go.th แจกเป็น PDF ซึ่งอ่านไม่ได้ในรอบนี้ **ยังไม่ยืนยันว่าเทียบเท่า CC-BY** ถ้าจะใช้ข้อมูลจาก data.go.th จริงต้องโหลด PDF มาอ่านก่อน (ไม่กระทบเรื่องฟีด Namtang ซึ่ง WF-004 ยืนยัน CC-BY จากหน้าประกาศของ สนข. เองแล้ว)
- **MapTiler Server / MapTiler Data license agreement** — เป็นเอกสารแยกที่ยังไม่ได้อ่าน ถ้าจะไปทางนี้ต้องอ่านก่อน
- **Mapbox Product Terms ฉบับเต็ม** — ตัวเลข 6,000 tiles / 750 tile packs มาจากเอกสาร SDK ไม่ใช่ตัวสัญญา
- **Stadia: "mobile application" ครอบคลุม PWA ไหม** — ต้องถาม support โดยตรง
- **ความครอบคลุมจริงของ Overture Places ในกรุงเทพฯ** — ยังไม่ได้วัด ถ้าจะสลับชั้นสถานที่ต้องนับก่อน

### จุดที่ต้องใช้ทนายจริงๆ

รายงานนี้ไม่ใช่คำแนะนำทางกฎหมาย ควรถามทนายถ้า:
- แอปเปลี่ยนจาก "ใช้คนเดียว" เป็นเปิดให้คนอื่นใช้จริง หรือขึ้น store
- มีรายได้เข้ามาเกี่ยวข้องไม่ว่าทางใด
- ตัดสินใจเอา OSM ไปปรับปรุงชั้นข้อมูลป้าย/สายของ สนข. (จุดชนวน share-alike ในข้อ 2)
- ต้องการเดิมพันฝั่ง "Produced Work" เพื่อไม่ต้องเปิดข้อมูล — ซึ่งรายงานนี้แนะนำว่าไม่คุ้ม
