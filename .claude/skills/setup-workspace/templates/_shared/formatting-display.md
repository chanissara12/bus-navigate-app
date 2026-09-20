# Formatting Display (shared fragment)

Used by: react, angular, netcore, go

Resolve rule: emit `## Plain` bullets always. If the target stack has its own named
section below, append its bullet(s) after the Plain ones — inline the merged result into
`### Formatting Display` in the final CLAUDE.md/AGENTS.md. Never leave a pointer to this
file in delivered output.

## Plain

- Date: `YYYY-MM-DD`
- DateTime: `YYYY-MM-DD HH:mm:ss`
- Time only: `HH:mm` / `HH:mm:ss`
- Money / amounts: 2 decimal places
- Yield / percentage return: 6 decimal places

## Go

- Money / amounts stored and computed as `shopspring/decimal.Decimal` — never `float64` for money, quantity, rate, or FX

## .Net Core

- Money / amounts stored as `decimal` — never `float`/`double`
