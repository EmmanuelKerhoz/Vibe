# Vibe — Coding Rules

These rules apply to all AI agents (GitHub Copilot, Copilot Chat, Copilot Workspace, etc.) working on this repository.

---

## General Approach

- Always check for a PRD (Product Requirements Document) before starting a new task and follow it closely.
- Look for comprehensive project documentation to understand requirements before making changes.
- Focus only on code areas relevant to the assigned task.
- Prefer iterating on existing code rather than creating new solutions.
- Keep solutions simple and avoid introducing unnecessary complexity.
- Make only requested changes or changes you're confident are well understood.
- Consider what other code areas might be affected by your changes.
- Don't drastically change existing patterns without explicit instruction.
- Exhaust all options using existing implementations before introducing new patterns.
- If introducing a new pattern to replace an old one, remove the old implementation.

## Code Quality

- Keep files under 300 lines of code; refactor when approaching this limit.
- Maintain a clean, organized codebase.
- Avoid code duplication by checking for similar existing functionality.
- Write thorough tests for all major functionality.
- All tests should always pass before deploying to production. If they don't, notify me.
- Consider different environments (dev, test, prod) when writing code.
- Unless explicitly instructed, instead of trying to gracefully handle an error or failure, fix the underlying issue.
- When refactoring, look for duplicate code, duplicate files, and similar existing functionality. Do not copy files and rename them — edit the file that already exists.

## Debugging & Issue Tracking

- If you run into the same persistent error, write logs and console messages to help track down the issue, and check the logs after making changes to verify resolution.
- If you run into issues that take multiple iterations to fix: after fixing, write a description of the problem and solution in a file under `fixes/<issue-name>.md`. Only do this for major issues.
- For issues taking multiple iterations, check the `fixes/` folder for previous fixes to see if the issue was encountered before.

## Documentation

- Keep a running list of patterns and technology used in `README.md`.
- Reference `README.md` for patterns and technology used in the project.

## Git & Version Control

- Never leave unstaged/untracked files after committing to git.
- Don't create new branches unless explicitly requested.
- Never commit `.env` files to version control.
- Never overwrite `.env` files without first asking and confirming.
- Never name files `improved-something` or `refactored-something`.

## Dev Server

- Kill all related running servers before starting a new one.
- Always start a new server after making changes to allow for testing.

## Data & Mocking

- Avoid writing one-time scripts in permanent files.
- Don't mock data except for tests (never for dev or prod environments).
