quackGIT 1-hour analysis update

Changed:
- Future Failure Analysis: all meaningful findings, no probability.
- Security Analysis: evidence-based findings.
- Testing Analysis: meaningful test gaps.
- Finding flow: What -> Where -> Why -> Why it happens -> What it can cause -> Severity -> Fix.
- VS Code sends filename/language and displays all three layers.
- Existing /prediction/ endpoint remains compatible with the `diff` field.

Copy these files into the corresponding project paths:
backend/app/models/prediction.py
backend/app/services/failure_prediction_service.py
backend/app/services/pr_prediction_service.py
backend/app/api/prediction.py
frontend/components/RepositoryAnalysis.tsx
quackgit-vscode/src/extension.ts

Then:
Backend: restart/redeploy Render.
Frontend: npm run build, then deploy Vercel.
VS Code: npm run compile, then npm run package.

Do NOT upload or commit .env, .env.backup, or private key files.
