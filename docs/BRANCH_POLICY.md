# Branch policy — Nexus Frontend

- `main`: release-ready code only.
- `develop`: integration branch for the current phase.
- `feature/NEXUS-XXX-*`: feature work based on `develop`.
- `bugfix/NEXUS-XXX-*`: corrective work based on `develop`.
- Direct pushes to `main` and `develop` are prohibited by process.
- Every merge requires a reviewed PR and linked Issue.
- Cross-repository work must link the matching Backend Issue/PR.
