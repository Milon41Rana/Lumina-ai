# Project Core Instructions & Rules

These rules MUST be followed by the AI Agent during every turn to ensure project stability and prevent regressions.

## 1. Code Integrity
- **Read Before Write**: Always use `view_file` to read the entire target file before making any edits. Understand the existing logic, especially complex parts like OAuth, Session handling, and State Management.
- **Surgical Edits**: Use `edit_file` or `multi_edit_file` for targeted changes. NEVER rewrite large sections of a file unless explicitly requested.
- **Preserve Features**: Do not remove or comment out existing features (e.g., GitHub Login, API Key fallback, Preview stabilization logic) unless specifically instructed to do so.

## 2. Stability & Verification
- **Linting**: After every meaningful batch of edits, run `lint_applet` to catch syntax or type errors.
- **Compilation**: Run `compile_applet` after completing a task to ensure the build pipeline is intact.
- **HMR & Previews**: Keep the previous stability fixes for the iFrame preview (e.g., debounced saving, stable `srcDoc` updates) intact.

## 3. Security & API
- **API Keys**: Maintain the multi-layered API key lookup (environment -> fallback -> secrets instructions).
- **Session Security**: Keep `trust proxy`, `SameSite: none`, and `secure: true` for cookies to work within the AI Studio iframe.

## 4. Specific Component Guardians
- `src/App.tsx`: Must preserve the `SandboxEngine` stabilization and GitHub auth message listener.
- `server.ts`: Must preserve the GitHub OAuth routes and session configurations.
