# Agent Navigation & Memory Directives
1. Zero Blind Crawling: Before crawling files across the repository, read .agent-kb/ or PROJECT_KB.md.
2. Mandatory Task & Bug Tracking:
   - For every task, UI refactor, or feature assigned, create/update .agent-kb/tasks/<task-name>.md.
   - For every resolved bug or diagnostic fix, document root cause and solution in .agent-kb/debug/<issue-name>.md.
3. Keep Memory Synced: Run 'npx @liulinnuha/lithium-kb' after updating .agent-kb/ docs.
4. Deterministic Output: Do not emit dynamic timestamps or session headers in knowledge markdown files.
