# Milestone 4 implementation notes

## Data flow

Dashboard chat sends a bounded request to `POST /api/chat`. The existing authentication dependency supplies the user identity. The route reads only that user's records, constructs a whitelisted evidence summary, optionally runs the financial/routine simulator, and optionally calls Gemini. The response includes exact evidence, recommendation conditions, graphs and an explicit source label.

The client cannot pass `user_id`, SQL or arbitrary tools. Client history is bounded and treated as untrusted conversation. Gemini cannot edit the database. Numeric explanation text and unknown evidence references cause fallback, but these checks do not establish semantic truth.

## Files added

- `backend/app/schemas/chat.py`: bounded request and module/plan validation.
- `backend/app/services/chat_service.py`: personal context, scenario outputs, Gemini handling and fallback.
- `backend/app/routes/chat.py`: authenticated chat endpoint.
- `frontend/src/components/GrowthSyncChat.jsx` and `.css`: dashboard chat, assumption fields, editable questions, line charts and exact tables.
- `backend/tests/test_chat.py` and `test_deployment_config.py`: isolated automated checks.
- `compose.yaml`, `deploy/`, `.dockerignore`, `.env.docker.example`: deployment setup.
- `backend/requirements.lock.txt`: tested dependency versions, matching the supplied ML artifact metadata for scikit-learn, NumPy, pandas and joblib. uvloop is conditional on non-Windows systems.

## Existing files updated

- Dashboard adds the chat component, keyed to the user identity.
- API client uses the same origin in production by default.
- Backend registers chat, marks API responses no-store, checks browser origins and returns a redacted 503 for an unhealthy database.
- Settings reject insecure production defaults. Authentication uses Secure cookies in production.
- Production password recovery reports that email delivery is not configured.
- `.env.example` removes the uploaded API-key value, and `.gitignore` excludes local secrets.

## Validation performed

72 automated tests passed, with 12 subtests, across chat, financial/routine scenarios, Gemini fallbacks, deployment settings and academic prediction. Tests use isolated fixtures and do not insert records into the user's database. A deprecation warning about the test client's HTTP library remains non-blocking.

Frontend production build and lint passed. A smoke prediction from the supplied student artifact succeeded. Compose YAML structure was parsed and checked.

A browser installation was unavailable in this workspace, so an interactive browser/visual check remains a local verification step. Docker was unavailable, so the container stack and live HTTPS were not executed. Gemini responses in the new chat tests are mocked. The new chat endpoint still needs a live check using the user's rotated key.

## Remaining deployment work

Choose the hosting account/server and domain, configure server-side secrets, start the containers and complete the end-to-end checks in the deployment guide. No online URL has been created by this update.
