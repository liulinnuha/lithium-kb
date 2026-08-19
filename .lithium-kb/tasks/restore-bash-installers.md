# Task: Restore Bash Installer and Uninstaller Scripts

## Objective
Restore `bin/install.sh` and `bin/uninstall.sh` to support users installing/uninstalling via interactive `curl | bash` pipelines.

## Implementation Details
- Restored `bin/install.sh` with interactive prompts for workspace initialization, global npm setup, and UI launch.
- Restored `bin/uninstall.sh` with support for standard cleanup, total purge, and system removal.
- Verified executable permissions (`+x`) and verified full test suite passes.
