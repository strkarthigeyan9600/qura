# Qura v3 — implemented features and integration boundaries

Updated 3 October 2026. This is a connected research and emergency-coordination **prototype**, demonstrated with synthetic identities, capacity and case information. It does not contact a real ambulance service, diagnose disease, or substitute for clinical protocols.

| Requirement | Implemented behavior | Validation |
| --- | --- | --- |
| Five stakeholder dashboards | Patient, assigned doctor, hospital administrator, assigned ambulance driver, selected receiving hospital | Real cookie login and role access checks; browser navigation for every role |
| Registration and profiles | Patient/doctor signup; pending doctor approval; admin-provisioned driver/hospital accounts; symptoms, vitals, history, medications, allergies, optional contact | Ownership, role escalation rejection, exact-role login and existing-account migration |
| Consent | Separate research consent and health-profile sharing consent; optional sharing of five available assistant exchanges | New requests/referrals blocked without sharing consent; profile and chat excerpts hidden on withdrawal |
| Assistant intake | Structured participant-described symptoms, timing and severity saved to own profile; consultation request form in assistant | Browser symptom intake and consultation request; no automated diagnosis or prescription |
| Consultations | Assigned-doctor requests, current consent-scoped profile, human notes, follow-up/testing/care/emergency outcomes, patient feedback | Browser patient → doctor workflow; outcome recorded once |
| Emergency referrals | Doctor-selected emergency outcome required; unique case ID; pickup location, optional authorized contact, priority, transport/department/bed requirements | Doctor scope, consent and preceding-stage guards; duplicate referral rejected |
| Administration dispatch | Referral verification, appropriate available unit selection, driver assignment, pre-pickup cancellation/reassignment | Transactional fleet reservation; illegal stage/role requests rejected |
| Driver acceptance and pickup | Accept/reject, journey to patient, pickup arrival and patient-onboard confirmation | Browser workflow and rejection/access-revocation tests |
| Hospital selection | Suitability, fresh reported capacity, 60 km demo search area, ranked cost and explanations for exclusion; driver requests destination | Zero-bed hospital disabled in browser; algorithm cannot accept a case |
| Receiving-hospital acceptance | Human confirmation reserves a suitable bed; rejection/withdrawal releases it and returns case for selection | Concurrent acceptance cannot reserve a bed twice; driver cannot depart without acceptance |
| Map and route display | Interactive local SVG schematic, pan/zoom, pickup/ambulance/hospital markers and simulated route links | Browser map controls and responsive case screenshots |
| Traffic prediction | Linear regression fitted to 168 generated hourly observations; current manually configured traffic factor; distance/ETA/cost ranking | Explicitly synthetic labels; no accuracy or real-road-navigation claim |
| GPS and tracking | Driver-entered demo positions; optional browser GPS after explicit user activation; GPS history, timestamps and stale-location warning | Manual position update travels through REST and authorized WebSocket feed to other dashboards |
| Live notifications | Selected-case WebSocket with session/origin/assignment checks, case-board status notices, REST polling fallback | Origin denial and assignment revocation close the feed; five-role browser synchronization |
| Availability changes | Traffic/capacity updates recalculate displayed estimates; acceptance withdrawal flags reconfirmation; human coordination notes | Capacity-change/reconfirmation and bed-release tests |
| Preparation and handover | Receiving-team readiness, driver hospital arrival, hospital arrival confirmation, driver handover notes, hospital admission/bed assignment and closure | Full five-account browser sequence and backend stage guards |
| Audit history | Immutable case timeline and content-free access/action audit; persisted GPS, referral and admission records | Append-only database triggers; every case action updates revision/timeline |
| Research separation | Existing six classical/quantum models, calibrated repeated CV, separate holdout, explanations, consensus, conformal sets, PDFs and what-if | Existing research tests retained; emergency chain runs with model/chatbot calls deliberately disabled |
| Private photo review | Existing patient upload and assigned-doctor review; authorization on image bytes | Existing upload/review browser flow and consent/access/security tests |
| Responsive UI | Shared role shell, visible sign-out/navigation, bounded tables/maps/forms/cards | Chromium viewport tests from 320–1440 px, short screens, and core Arabic RTL shells |

## What is simulated or not externally connected

Hospital reports are manually entered; demo hospitals and units are fictional. A free-bed report is **not** acceptance. The route service uses great-circle distance with a 1.3 approximation factor and a 35 km/h baseline, modified by synthetic traffic. Lines on the map are not a road network. The prediction model is trained on generated history; it has no measured real-world forecasting accuracy. It does not invoke clinical research models.

No live map tiles, turn-by-turn navigation, traffic provider, ambulance dispatch agency, hospital-information-system connection, SMS, push notification service, or automated medication decision is configured. Driver browser GPS is implemented but permission/device behavior must be verified on the intended secure deployment. The optional language-model adapter remains disabled unless explicitly configured; local guidance is labeled.

When a live feed fails, the UI reports its connection state and continues three-second REST polling. When GPS fails, it offers manual position entry. When no eligible hospital exists or acceptance is withdrawn, users coordinate manually and record a note; the algorithm cannot override capacity/acceptance gates. Fleet reassignment is supported before pickup; transport replacement after pickup requires an external clinical/dispatch protocol and is not automated here.

The new care/emergency screens use English. Existing nine-language core catalogs, research summaries and Arabic shell direction remain available. New specialist copy needs a separate translation review. SQLite storage is a local prototype, not encrypted multi-tenant production infrastructure.

## Demo sequence

1. Seed fictional accounts/resources with `python -m backend.seed_demo`. Research training and fictional measurement reports are optional: add `--train --reports` when needed.
2. Patient opens **Health profile**, saves synthetic information and sharing consent, then opens **Consultations** to request an assigned doctor. Assistant also provides structured intake/request forms.
3. Doctor opens **Consultations**, reviews the profile, records a human **Emergency referral required** outcome, and submits pickup/transport/referral details.
4. Administrator opens **Emergency cases**, verifies the referral and assigns an available ambulance.
5. Driver accepts dispatch, begins the pickup journey, optionally shares manual demo positions, confirms arrival and patient onboard, ranks hospitals, and requests a suitable destination.
6. Selected hospital confirms capacity and acceptance, then records bed/team preparation. Driver begins the hospital journey only after acceptance.
7. Driver records hospital arrival; receiving hospital confirms it; driver records handover; hospital records admission and assigned bed. The case closes and the ambulance becomes available. The reserved bed becomes occupied and is not returned to the free count.
8. Patient, doctor and administration see authorized status and timeline updates. Any rejected/reassigned driver or rejected hospital immediately loses future case access.

## Operational setup

Eleven fictional accounts share the configured private `QURA_DEMO_PASSWORD` on first creation. Existing passwords are retained. Driver accounts: `driver1@qura.demo`, `driver2@qura.demo`. Receiving accounts: `hospital1@qura.demo` (A, no free beds), `hospital2@qura.demo` (B), `hospital3@qura.demo` (C). Select the corresponding login portal before signing in. Administrator provisions additional service accounts and registers units/hospitals under **Fleet & hospitals**. Hospital users update their own report under **Hospital capacity**.

Existing users, sessions and assignments are preserved by a transactional migration that expands allowed roles. New structured tables hold profiles, consultations, fleet, hospitals, cases, timeline events and GPS points. REST and WebSocket endpoints are documented by the running FastAPI `/docs`; the same-origin frontend proxy must forward WebSocket upgrades. Production infrastructure needs TLS, approved origin settings, backups, encryption, consent governance, operational protocols and independently tested integrations before handling real health/location information.
