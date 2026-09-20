# Wayfinding operations — local-markdown tracker

โปรเจกต์นี้ยังไม่มี issue tracker ต่อไว้ (ไม่มี `.jira/config.local.json` และไม่ใช่ git repo)
wayfinder จึงใช้ **local-markdown tracker**: map และ ticket เป็นไฟล์ในโฟลเดอร์นี้

## โครงสร้าง

```
.wayfinder/
├── MAP.md                     ← the map (label: wayfinder:map)
├── tickets/WF-NNN-slug.md     ← child issues ของ map
└── research/                  ← assets ที่ ticket อ้างถึง
```

## Ticket format

frontmatter คือ metadata ของ issue ทั้งหมด:

```yaml
---
id: WF-001
title: <ชื่อ ticket — ใช้ชื่อนี้เวลาอ้างถึง ไม่ใช่ id>
label: wayfinder:research | wayfinder:prototype | wayfinder:grilling | wayfinder:task
status: open | closed
assignee: null # ← ใส่ชื่อผู้ทำ = การ claim ทำก่อนเริ่มงานเสมอ
blocked-by: [WF-002] # native dependency; ว่าง = ไม่ถูกบล็อก
---
```

body คือ `## Question` ตอนเปิด และเพิ่ม `## Resolution` ตอนปิด

## Queries

- **frontier** (ticket ที่หยิบได้ตอนนี้) — `status: open` + `assignee: null` + ทุกตัวใน `blocked-by` เป็น `closed`
- **claim** — แก้ `assignee:` ก่อนลงมือทำ
- **resolve** — เขียน `## Resolution`, เปลี่ยน `status: closed`, แล้วเพิ่มบรรทัดใน Decisions so far บน MAP.md

หา frontier เร็วๆ:

```bash
grep -l "status: open" .wayfinder/tickets/*.md | xargs grep -L "assignee: [^n]"
```

(ยังต้องเช็ค `blocked-by` ด้วยตาอีกที — ถ้าย้ายไป Jira/GitHub เมื่อไหร่ ให้ใช้ native blocking แทน)
