# Verification — 3 October 2026

The current branch is `codex/qura-portals-upgrade` in `C:\Users\strka\Downloads\mlp`.

| Check | Outcome |
| --- | --- |
| `npm run build` | Passed, TypeScript and Vite 7.3.6 production output |
| `npm test` | 33 passed: 28 legacy regressions, 4 real-portal tests, 1 catalog consistency test |
| `python -m pytest backend -q` | 28 passed using isolated temporary SQLite/artifact storage |
| `npm run test:e2e` | 3 passed in Chromium; fresh random temporary storage |
| Full synthetic demo seed | Six fictional profiles, three generated measurement reports, six-model Heart experiment |
| Benchmark | 5-fold CV × 2 repeats, untouched final holdout, matched two-component equal-budget configuration |
| Manual browser | Login/theme, assigned doctor queue and report details, measured research evaluation, logout |

The browser flows exercise patient signup → consent → synthetic measurements → own report → chat; assigned doctor login → note → approval; and owner history deletion → Arabic RTL. A test caught a delayed consent toggle and another caught demo-fill availability before schemas loaded. Both interactions were fixed. Reusing an E2E directory also retained language preferences; each run now uses a fresh random directory.

The complete demo uses seed 42, sigmoid calibration, two PCA features, 120 VQC evaluations per member and 3 member seeds. Measured development mean AUC: logistic regression 0.8945, quantum kernel 0.7007, VQC 0.8530. The report generator reads the remaining models, final-test results and seed-loss spread from SQLite. Browser smoke runs use fewer folds/two models and are not the published benchmark results.

The visual QA account was fictional and temporary; it was removed after logout. No production patient identity or medical data was used. The saved screenshot is `docs/screenshots/qura-navy-teal.jpg`.

The updated 12-page project PDF was rendered page-by-page and visually inspected. Its extracted text includes measured CV results, the API scope and limitations. Sample audience PDFs generated successfully for all nine languages on Windows; rendered Tamil and Arabic samples were inspected for glyph coverage, shaping and layout. These checks do not replace professional language review.

## Security/dependency review

CORS uses an explicit allow-list; cookie mutations require an allowed Origin outside the test harness. Access and refresh cookies are HttpOnly and SameSite Strict; revocation/rotation is persisted. Passwords use Argon2 and strength bounds. Uploads/inputs are bounded; model files are server-generated and no user-provided joblib is accepted. Credential files are excluded from Git and Docker build context. The API sends no-store and basic security headers. Python's verified dependency closure is pinned in `backend/requirements.lock`; npm uses `package-lock.json`.

`npm audit fix` and compatible Vite/Vitest upgrades removed the earlier critical Vitest finding. Five **high** transitive findings remain in the retained Tailwind 3 chain (`braces`, `micromatch`, `chokidar`, `fast-glob`, `tailwindcss` in this audit). Registry audit suggested a Tailwind 4 migration, which would require changing the preserved styling pipeline. This is an outstanding development-toolchain limitation; do not expose the dev server publicly.

## Unverified / incomplete areas

Live Anthropic requests were not made: no provider account/model was configured, and external transmission defaults off. Deterministic templates and labeled local assistant guidance were tested. Docker execution, microphone recognition, installed-language speech voices, mobile browsers, HTTPS deployment and independent clinical validation were not verified.

Core UI labels, safety messages and patient templates are translated across nine languages, but specialized research descriptions and technical PDF headings retain English fallback. This is not a claim of complete professionally reviewed UI translation. Emergency and output safeguards are phrase/number guards; they are not clinical safety certification. SQLite append-only triggers are not protection against a filesystem administrator. Counterfactual search is bounded and not globally minimal; SHAP can return an explicitly labeled global fallback.

Parkinsons repeated recordings need grouped subject validation. Descriptive CV intervals summarize correlated folds; conformal sets are label sets, not probability intervals. No quantum advantage or diagnostic validity is claimed.
