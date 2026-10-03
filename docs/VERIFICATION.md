# Verification — 3 October 2026

The current branch is `main` in `C:\Users\strka\Downloads\mlp`.

| Check | Outcome |
| --- | --- |
| `npm run build` | Passed, TypeScript and Vite 7.3.6 production output |
| `npm test` | 33 passed: 28 legacy regressions, 4 real-portal tests, 1 catalog consistency test |
| `python -m pytest backend -q` | 38 passed using isolated temporary SQLite/artifact storage |
| `npm run test:e2e` | 15 passed in Chromium; fresh random temporary storage |
| Full synthetic demo seed | Eleven fictional accounts, two ambulance units, three hospitals, three generated measurement reports, six-model Heart experiment |
| Benchmark | 5-fold CV × 2 repeats, untouched final holdout, matched two-component equal-budget configuration |
| Manual browser | Login/theme, assigned doctor queue and report details, measured research evaluation, logout |

The browser flows exercise patient signup → consent → synthetic measurements → own report → chat; assigned doctor login → note → approval; and owner history deletion → Arabic RTL. A test caught a delayed consent toggle and another caught demo-fill availability before schemas loaded. Both interactions were fixed. Reusing an E2E directory also retained language preferences; each run now uses a fresh random directory.

Photo-review update: a fourth browser flow uploads a synthetic PNG as an assigned patient, opens it under the assigned doctor's account, posts a human review, and verifies that the patient sees the note. New backend tests cover consent/assignment prerequisites, access to image bytes, cross-patient and unassigned-doctor isolation, immediate assignment revocation, administrator read-only access, owner deletion, invalid/oversized images and EXIF removal. Images are never model inputs or assistant context. The production build passes, with a non-fatal warning that the main bundle exceeds 500 kB before gzip.

The complete demo uses seed 42, sigmoid calibration, two PCA features, 120 VQC evaluations per member and 3 member seeds. Measured development mean AUC: logistic regression 0.8945, quantum kernel 0.7007, VQC 0.8530. The report generator reads the remaining models, final-test results and seed-loss spread from SQLite. Browser smoke runs use fewer folds/two models and are not the published benchmark results.

The visual QA account was fictional and temporary; it was removed after logout. No production patient identity or medical data was used. The saved screenshot is `docs/screenshots/qura-navy-teal.jpg`.

The updated 15-page project PDF was rendered page-by-page and visually inspected. Its extracted text includes measured CV results, the API scope and limitations. Sample audience PDFs generated successfully for all nine languages on Windows; rendered Tamil and Arabic samples were inspected for glyph coverage, shaping and layout. These checks do not replace professional language review.

## Security/dependency review

CORS uses an explicit allow-list; cookie mutations require an allowed Origin outside the test harness. Access and refresh cookies are HttpOnly and SameSite Strict; revocation/rotation is persisted. Passwords use Argon2 and strength bounds. Uploads/inputs are bounded; model files are server-generated and no user-provided joblib is accepted. Credential files are excluded from Git and Docker build context. The API sends no-store and basic security headers. Python's verified dependency closure is pinned in `backend/requirements.lock`; npm uses `package-lock.json`.

`npm audit fix` and compatible Vite/Vitest upgrades removed the earlier critical Vitest finding. Five **high** transitive findings remain in the retained Tailwind 3 chain (`braces`, `micromatch`, `chokidar`, `fast-glob`, `tailwindcss` in this audit). Registry audit suggested a Tailwind 4 migration, which would require changing the preserved styling pipeline. This is an outstanding development-toolchain limitation; do not expose the dev server publicly.

## Unverified / incomplete areas

Live Anthropic requests were not made: no provider account/model was configured, and external transmission defaults off. Deterministic templates and labeled local assistant guidance were tested. Docker execution, microphone recognition, installed-language speech voices, mobile browsers, HTTPS deployment and independent clinical validation were not verified.

Core UI labels, safety messages and patient templates are translated across nine languages, but specialized research descriptions and technical PDF headings retain English fallback. This is not a claim of complete professionally reviewed UI translation. Emergency and output safeguards are phrase/number guards; they are not clinical safety certification. SQLite append-only triggers are not protection against a filesystem administrator. Counterfactual search is bounded and not globally minimal; SHAP can return an explicitly labeled global fallback.

Parkinsons repeated recordings need grouped subject validation. Descriptive CV intervals summarize correlated folds; conformal sets are label sets, not probability intervals. No quantum advantage or diagnostic validity is claimed.

## Navigation and responsive-layout repair

Research tools now render inside the signed-in role portal: administrators keep their sidebar, role heading, user management, audit and sign-out controls. Login verifies the exact selected role. Sidebar scrolling on short desktops and labeled wrapping navigation on small screens prevent hidden controls. Content grids, tool tabs, forms, tables, photo cards and chat resize without page-level horizontal overflow. Table and circuit overflow stays inside their own scroll areas.

Chromium coverage visits every patient, doctor and administrator portal page at 360, 390, 768, 1024 and 1440 pixels with a 600-pixel viewport height, plus all research tabs and Arabic RTL shells. Login/signup are checked down to 320 pixels. Added workflows verify exact-role sign-in rejection and administrator approval/assignment followed by doctor access. Tests capture uncaught page errors; the screenshot accounts and data are fictional.

Additional repairs clear stale reports and what-if results after switching pages/reports, clear model selections after changing datasets, reject blank measurement fields before report submission, and display failures from administrator actions, logout, language persistence, chat deletion and voice startup. These checks establish tested behavior, not a guarantee that every possible bug is absent. Physical mobile devices, live external AI, microphone permissions and production hosting remain unverified.

Responsive screenshots: `docs/screenshots/admin-research-desktop.png` and `docs/screenshots/admin-research-mobile.png`. `deploy.zip` has been rebuilt from the current production frontend; it requires the API backend.

## Connected emergency-system upgrade

Seven new backend tests validate the complete model-independent transport chain; consent and role isolation; driver rejection/reassignment; hospital acceptance withdrawal and bed release; concurrent acceptance; capacity-change reconfirmation; WebSocket origin checking/access revocation; admin service-account provisioning; and preservation of identities, sessions and assignments when the role schema expands. The emergency browser workflow uses five separate real cookie contexts, drives consultation/referral/verification/dispatch/pickup/hospital acceptance/preparation/arrival/handover/admission through UI controls, checks zero-capacity exclusion, and receives a location update on a patient WebSocket. Additional browser tests check structured assistant intake, consultation requests and driver/hospital layouts.

The browser run exposed a race in which an earlier action response cleared a newer preparation note typed after a live state update. The handler now clears only the note value it actually submitted. Existing photo, reports, role-navigation, Arabic and consent flows remain in the suite. New care/emergency copy is English; existing core catalogs retain Arabic RTL. Browser GPS permission/hardware, live traffic and hospital systems, real navigation, production deployment and clinical outcomes are unverified.

Emergency desktop/mobile screenshots: `docs/screenshots/emergency-driver-desktop.png` and `docs/screenshots/emergency-driver-mobile.png`. The 15-page project report includes the connected-care workflow and explicit integration boundaries.
