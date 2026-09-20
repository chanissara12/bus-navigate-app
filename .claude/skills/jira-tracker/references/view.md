# view

```
node scripts/jira.mjs view -id|--id <issueKey>
```

Fetches a single issue and prints it using the same detail-block format as `list` (table header with Task/Status, then Type/Priority/Assignee/Parent/Sprint/Label/Due Date/Story Point/URL/Attachment/Description — optional fields only shown when present).
