# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository

**Frontend App:** see [../frontend/AGENTS.md](../frontend/AGENTS.md)

## Tech Stack

This is a brand-new project — nothing is scaffolded yet. The list below is the planned
baseline; update it once real dependencies land in `*.csproj`/`packages.lock.json`.

- .NET Core Web API (C#)
- Entity Framework Core (planned)

## Architecture

- Business logic belongs only in Service.
- Controllers should only orchestrate requests and responses.
- Do not access DbContext directly from Controller.
- Reuse existing services before creating new ones.
- Keep dependency direction unchanged.

## Project Structure

This is a proposed layout for the new project, not a survey of existing code.

```
.editorconfig
BusNavigate.Domain          # Shared domain models, interfaces, DTOs, helpers and DbContext.
    Constants/
    Database/            # database context
    Exceptions/          # exception
    Extensions           # extension method
    Helpers/              # helper
    Interfaces/           # domain interface prefix with `I` e.g. `IPaymentService`
        <Feature>/
    ViewModels/           # view model
        <Feature>/
    efpt.config.json
BusNavigate.Server           # http server
    AutoMapper/           # mapper profile
    Controllers/          # controller
        <Feature>/
    Middlewares/
    appsettings.json
    Program.cs            # app run
BusNavigate.Service          # Business logic implementation.
    Extensions/
    Implements/
        <Feature>/
BusNavigate.Service.Test     # Unit Test
```

### Rules

- Keep the `Domain` / `Server` / `Service` dependency direction unchanged — `Server`
  depends on `Service` and `Domain`; `Service` depends on `Domain` only; `Domain` depends
  on nothing project-specific.
- New feature code goes under the matching `<Feature>/` folder in `Interfaces/`,
  `ViewModels/`, and `Implements/` — do not scatter feature code across unrelated folders.

## Coding Convention

### Naming

| Pattern            | Use for                                             |
| ------------------ | ---------------------------------------------------- |
| `PascalCase`        | Classes, methods, properties, public fields, constants |
| `camelCase`         | Local variables, method parameters                     |
| `_camelCase`        | Private fields                                          |
| `IPascalCase`       | Interfaces (e.g. `IPaymentService`)                     |

### Coding Rules

- Handle null values safely
- Do not swallow exceptions silently
- Keep methods focused and small
- Avoid duplicated logic. Extract helper methods only when reuse or clarity is improved
- Prefer async/await for I/O operations
- Do not use `.Result` or `.Wait()`
- Log via the injected `ILogger<T>` — never `Console.WriteLine`
- Register services with the correct DI lifetime (`Scoped` for request-bound state, `Singleton` for stateless/shared, `Transient` sparingly) — never resolve a `Scoped` service from a `Singleton`

### Business Validation

This repo doesn't have a validation exception yet. The first time a task needs to report
a business-validation failure, create one matching the shape below, then reuse it
consistently — don't reinvent the shape per feature.

```csharp
public class ValidateException : Exception
{
    public List<string> Messages { get; } = [];
    public override string Message => string.Join(", ", Messages);

    public ValidateException() { }
    public ValidateException(string message) => Messages.Add(message);

    public void Add(string message) => Messages.Add(message);

    public void ThrowIfAny()
    {
        if (Messages.Count > 0) throw this;
    }
}
```

Usage:
```csharp
// single error
throw new ValidateException("File not found.");

// multiple errors
var ex = new ValidateException();
if (data == null) ex.Add("This date does not exist.");
if (isLinked) ex.Add("Cannot delete: linked to an existing record.");
ex.ThrowIfAny();
```

This is a minimal starting shape, not a mandate to copy every feature of a battle-tested
version — if the project later needs field-level error targeting (e.g. an `ElementId`
per message for highlighting a specific form field), that's an extension to make when the
need actually shows up, not something to pre-build here.

### API Rules

- Keep API response format consistent with existing endpoints
- DO NOT change route names, request models, or response models unless required
- Return meaningful error messages without exposing sensitive internal details

### Database / EF Core Rules

- DO NOT modify database schema unless explicitly requested
- DO NOT rename EF-generated entity classes or properties
- Use existing DbContext and entity patterns
- Avoid N+1 queries
- Use extension method `.CustomSqlQueryAsync<T>` for getting results from stored procedures
- Use `AsNoTracking()` for read-only queries
- Use `Include()` only when necessary
- Avoid loading unused navigation properties

### AutoMapper

- Reuse existing AutoMapper profiles
- Do not perform manual mapping if AutoMapper already exists

### Editor Config

This repo enforces formatting via `.editorconfig` at the repo root. An AI agent has no
built-in mechanism to auto-load editor config files the way an IDE does — the concrete
rule is restated here so it's actually in context. Match it in every file you write or
edit; don't infer indentation by eyeballing surrounding code.

- Indent: 4 spaces (repo-wide default)
- Line endings: LF, UTF-8, final newline required
- Trailing whitespace trimmed (except Markdown, where it's meaningful for line breaks)
- Line endings are enforced by `.gitattributes` at the repo root, not by your local Git
  settings — never "fix" them by hand, and never change `core.autocrlf` to work around a
  complaint from a formatter
- `.vscode/settings.json` is committed and pins the same rules for the editor. It is not
  personal configuration — do not add themes, fonts, or machine-specific paths to it, and
  do not relax its formatting keys to match a file that is already wrong
- `.csproj`/`.props`/`.targets` use 2 spaces instead of the 4-space default

If a formatter reports a line-ending or whitespace failure across files you did not
touch, that is a repository configuration problem, not a code problem. Report it and
leave it alone. Do not answer it with a repo-wide reformat, and never let unrelated
reformatted files ride along in a change.

### Formatting Display

- Date: `YYYY-MM-DD`
- DateTime: `YYYY-MM-DD HH:mm:ss`
- Time only: `HH:mm` / `HH:mm:ss`
- Money / amounts: 2 decimal places
- Yield / percentage return: 6 decimal places
- Money / amounts stored as `decimal` — never `float`/`double`

### Comment Code

- `// Note:` — allowed for context that aids understanding
- `// TODO:` — if encountered **in files you are editing**, flag it to the user before proceeding

### Before Creating New Code

Before creating a new helper, extension, service, DTO, ViewModel, or interface — search
whether an equivalent implementation already exists and reuse it whenever possible.
Before introducing any new type, ask the user to confirm its name unless the name is
explicitly specified in the requirement.

### Commands

```bash
dotnet restore
dotnet build
dotnet test
dotnet format --verify-no-changes   # enforces .editorconfig; must pass in CI too
```

## Testing & Quality

Before marking a task complete:

1. Run build command
2. Fix all compile errors
3. Check affected flows manually
4. Add or update tests when business logic changes

### Test Runner

- Use XUnit for all unit tests
- Use Moq for mock dependencies

### Unit Test Rules

Unit test required for:

- Business logic
- Validation
- Calculation
- Permission
- Bug fixes

#### Test Style

- Use Arrange / Act / Assert
- Use clear test names
- Test both success and failure cases
- DO NOT test private methods directly
- Prefer testing public behavior

### Rules

- **DO NOT edit a test to make a failure pass.** When a test breaks after a code change, stop and report which tests failed and why — decide whether the _code_ regressed or the expected behavior genuinely changed, summarize the impact, and wait for explicit approval before touching any test. Do not assume the test is wrong just because it is red.

Root-wide rules (security, Definition of Done) live in
[../AGENTS.md](../AGENTS.md) — this file only covers what's specific to the backend.
