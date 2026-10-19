# Project Rules: COSMO999

## 1. Mock & Test Data Protection (STRICT)
- **NEVER push mock or simulated data to Git or Production**: Files containing mock data, test seeds, or simulated gameplay (such as `mock/`, `src/mock/`, `*.mock.ts`, `*.mock.json`) are strictly for local testing only.
- **Git Stage Verification**: Before any commit or push, verify with `git status` and ensure that no mock data files, temporary test fixtures, or dev credentials (`.env.local`) are staged or included.
- **Production RTDB Protection**: Never write mock data or test mutations into the production Firebase RTDB node (`dummyRoom`). When testing writes against Firebase, use an isolated node such as `dummyRoom_dev`.

## 2. Git & Push Restrictions
- **No Automatic Push**: The assistant must NEVER run `git push` autonomously. Only the user may push, or the assistant may do so only when explicitly instructed by the user.
- **Maintain Local Cleanliness**: Keep local test files ignored in `.gitignore`.

## 3. UI & Design System Guidelines
- Follow iOS 18 frosted glass and mobile-first touch ergonomics (minimum touch targets 44-52px, active feedback).
- Keep text concise, minimal, and avoid clutter or redundant explanations in UI elements.
