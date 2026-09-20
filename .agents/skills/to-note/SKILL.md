---
name: to-note
version: 0.1.0
description: Capture input into the personal Obsidian vault at D:\Projects\Personal\obsidian-note, routed to Inbox/Projects/Knowledge/People with the matching index updated. Trigger on "เก็บลง note", "เก็บลง vault", "จดลง note", "บันทึกลง vault", or /to-note. Do NOT trigger on a bare "จด"/"จำไว้" — that means a temp in-conversation note, not vault persistence.
argument-hint: "<content to capture>"
---

# To Note

Takes arbitrary input and files it into `D:\Projects\Personal\obsidian-note` following that
vault's existing PARA-style conventions. This skill only writes inside that one vault — it
does not create the vault or its top-level folders (`00 Inbox`, `01 Projects`,
`02 Knowledge`, `03 People`, `99 Archive`), which already exist.

## Vault structure

```
D:\Projects\Personal\obsidian-note
├── vault-index.md
├── 00 Inbox/
│   └── inbox-index.md
├── 01 Projects/
│   └── projects-index.md
├── 02 Knowledge/
│   ├── knowledge-index.md
│   └── <Topic>/              e.g. SFTP/
│       └── <note>.md
├── 03 People/
│   ├── people-index.md
│   └── <name-kebab>.md
└── 99 Archive/                (empty, no index yet — out of scope)
```

## Vault conventions (do not deviate)

- Filenames: kebab-case, no `\ / : * ? " < > | # %`.
- Every note gets frontmatter `created: <today, YYYY-MM-DD>` and `tags: [...]` (lowercase
  kebab-case, inferred from content).
- Links are plain wikilinks `[[filename]]` or `[[filename|Display Text]]`. Filenames are
  unique vault-wide, so no folder path needed in the link.
- Never touch `vault-index.md` or `99 Archive/` — out of scope for this skill.
- Don't auto-commit. Create/edit files and stop; let the user review the diff.

## 1. Classify the input

Decide the destination folder from the content, in this priority order:

| Signal | Destination |
| --- | --- |
| Primarily about a specific person (name, role, company) | `03 People/<name-kebab>.md` |
| Has a clear, named project it belongs to | `01 Projects/<Project-Name>/<note-filename>.md` |
| Durable reference/how-to knowledge with a clear topic | `02 Knowledge/<Topic>/<note-filename>.md` |
| Anything else / not clearly any of the above | `00 Inbox/<note-filename>.md` (default) |

Rules:

- **Don't invent a project or topic name.** If the input doesn't name one clearly, don't
  guess — fall back to Inbox instead of manufacturing a Project/Topic subfolder.
- **Before creating a new `Project-Name` or `Topic` subfolder**, list the existing
  subfolders under `01 Projects/` and `02 Knowledge/` and check if the input belongs to
  one that already exists (case-insensitive, watch for near-duplicates like `SFTP` vs
  `sftp-setup`). Reuse the existing subfolder instead of creating a near-duplicate.
- If genuinely ambiguous between two destinations, ask the user once with a short
  multiple-choice — don't ask for every capture, only when signals conflict.
- `People` and `Inbox` notes are single files directly in their folder — no subfolders.

## 2. Write the note

- Resolve the filename (kebab-case, from a short version of the content/title).
- Frontmatter: `created:` + `tags:` always. For People notes, also add `company:`,
  `role:`, and a `## Related` section for wikilinks to related notes.
- Body: the captured content, lightly formatted — don't over-edit the user's input.

## 3. Wire up the index

Each folder's index lives at `<folder>/<folder>-index.md` and lists notes as
`- [[note-filename|Display Title]]`.

- **Inbox** → append to `00 Inbox/inbox-index.md`'s flat list.
- **People** → append to `03 People/people-index.md`'s flat list. If the note references
  another existing note (e.g. a Knowledge note that mentions this person), add a
  `Related:` wikilink on **both** sides — this vault's cross-links are manual and
  bidirectional by convention, not automated.
- **Knowledge** → add the link under the matching `## <Topic>` heading in
  `02 Knowledge/knowledge-index.md`. Create the heading if the topic is new.
- **Projects** → add the link under the matching `## <Project Name>` heading in
  `01 Projects/projects-index.md`. Create the heading if the project is new.
  - `projects-index.md` currently has no real sections yet (still the placeholder "ว่าง"
    body). The first time a project note is created, rewrite it from scratch into the
    `## <Project Name>` structure — mirror the shape of `knowledge-index.md` exactly
    (frontmatter `tags: [projects, index]`, `# Projects` heading, one `##` per project).
    Don't leave the placeholder body alongside the new structure.

## 4. Report

Tell the user which file was created, which subfolder (if new) was created, and which
index line(s) were added — so they can review before committing.
