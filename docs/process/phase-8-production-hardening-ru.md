# Phase 8 — Production Hardening (RU)

Дата: 2026-05-23

## Цель

Закрыть критичные runtime-риски MVP перед production rollout:

- минимальная API security baseline;
- валидация входных payload;
- базовая защита от abuse (rate limit);
- traceability запросов;
- контрольный hardening-check script.

## Реализовано

1. API key auth для write-методов (`POST/PUT/PATCH/DELETE`):
- env: `RANDEE_API_KEY`;
- заголовок: `x-randee-api-key`.

2. Request tracing:
- каждый ответ получает `x-request-id`.

3. In-memory rate limiting:
- env: `RANDEE_RATE_LIMIT_WINDOW_MS` (default `60000`);
- env: `RANDEE_RATE_LIMIT_MAX` (default `120`).

4. Input validation в `apps/api`:
- non-empty string checks;
- enum checks (`role`, `source`);
- positive number checks (`filesCount`).

5. Regression tests:
- API тест на auth behavior;
- сохранены тесты marketplace/cloud flows.

6. Phase 8 verification script:
- `npm run randee:hardening:check`

## Важно

Текущая security-модель MVP подходит для controlled environments.
Для полноценного production нужны:

- JWT/OAuth2 authN + role-based authZ;
- distributed rate limit store (Redis);
- centralized logs/metrics/tracing;
- secret management и rotation policy.
