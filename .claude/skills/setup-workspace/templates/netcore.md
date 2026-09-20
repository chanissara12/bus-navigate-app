# {{FILE_NAME}}

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository

<!--
  resolve: if this backend is the sub-app of a mono-repo with its own frontend, link the
  frontend's system-prompt file here, e.g.:
  > **Frontend App:** see [<frontend-folder>/{{FILE_NAME}}](<frontend-folder>/{{FILE_NAME}})
  Omit this line entirely for a standalone backend repo.
-->

## Tech Stack

<!--
  resolve: agent-authored, not copied from this template.
  List only what's common/core to a .NET backend (framework, language, ORM). Do NOT
  carry over deep or project-specific choices (mapping library, message queue, hosting,
  specific DB engine) from this template — detect those from the repo's *.csproj/
  packages.lock.json and list what's actually there. If something can't be detected,
  leave it for the user to fill in manually rather than guessing. Testing libraries
  belong in the Test Runner subsection under Testing & Quality, not here.
-->

- .NET Core Web API (C#)
- Entity Framework Core (if present)

## Architecture

- Business logic belongs only in Service.
- Controllers should only orchestrate requests and responses.
- Do not access DbContext directly from Controller.
- Reuse existing services before creating new ones.
- Keep dependency direction unchanged.

## Project Structure

```
.editorconfig
<Project>.Domain          # Shared domain models, interfaces, DTOs, helpers and DbContext.
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
<Project>.Server           # http server
    AutoMapper/           # mapper profile
    Controllers/          # controller
        <Feature>/
    Middlewares/
    appsettings.json
    Program.cs            # app run
<Project>.Service          # Business logic implementation.
    Extensions/
    Implements/
        <Feature>/
<Project>.Service.Test     # Unit Test
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

<!--
  resolve: agent-authored, conditional.
  Search the repo (typically Domain/Exceptions or similar) for a custom exception class
  built to report validation failures — both a single-error constructor (e.g.
  `throw new XxxException("message")`) and a multi-error accumulator (an `.Add()`-style
  method that appends messages, plus a `.Throw()`/`.ThrowIfAny()` that only throws if
  messages were actually added).

  CASE A — found: name the REAL class as it exists in this repo (it will not be called
  "ValidateException" in every repo). Show BOTH real usages pulled from actual call
  sites — the single-error `throw new Xxx("...")` form AND the multi-error
  `.Add()` .. `.Throw()` form — not just one of them. Tell future agents to reuse it:
  the single form for one failure, the accumulator form when a validation step can
  report more than one problem, never a bare `throw new Exception(...)`.

  CASE B — not found, existing repo with no interest in adding one: delete this whole
  subsection; don't invent a pattern nobody asked for.

  CASE C — not found, new/empty project (per step 1): don't delete the section and don't
  scaffold the class file right now either — this skill only writes documentation, not
  source files (see the top of this SKILL.md). Instead write this section as a standing
  instruction with the canonical shape embedded directly below, so the project is
  self-contained even though it doesn't reference anything outside itself: "This repo
  doesn't have a validation exception yet. The first time a task needs to report a
  business-validation failure, create one matching the shape below, then reuse it
  consistently — don't reinvent the shape per feature."

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

  This is a minimal starting shape, not a mandate to copy every feature of a
  battle-tested version — if the project later needs field-level error targeting (e.g.
  an `ElementId` per message for highlighting a specific form field), that's an
  extension to make when the need actually shows up, not something to pre-build here.
-->

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

<!-- resolve: _shared/editor-config.md (Plain + .Net Core) -->

### Formatting Display

<!-- resolve: _shared/formatting-display.md (Plain + .Net Core) -->

### Comment Code

<!-- resolve: _shared/comment-code.md (Plain) -->

### Before Creating New Code

<!-- resolve: _shared/before-creating-new-code.md (Plain, {{ARTIFACTS}}="helper, extension, service, DTO, ViewModel, or interface") -->

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

<!-- resolve: _shared/testing-no-edit-rule.md (Plain) -->

## Security Rules

<!-- resolve: _shared/security-rules.md (Plain + .Net Core) -->

## Definition of Done

<!-- resolve: _shared/definition-of-done.md (Plain) -->
