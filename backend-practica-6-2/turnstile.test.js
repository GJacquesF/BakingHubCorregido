import assert from "node:assert/strict";
import test from "node:test";

import { verificarTurnstile } from "./turnstile.js";

test("Turnstile exige token cuando la clave está configurada", async () => {
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY = "secret";
    await assert.rejects(() => verificarTurnstile(""), /Captcha requerido|No se pudo verificar/);
});

test("Turnstile queda deshabilitado si no hay clave configurada", async () => {
    delete process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    delete process.env.NODE_ENV;
    await assert.doesNotReject(() => verificarTurnstile("token"));
});

test("Turnstile no permite deshabilitar la validación en producción", async () => {
    delete process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    process.env.NODE_ENV = "production";
    await assert.rejects(() => verificarTurnstile("token"), /CLOUDFLARE_TURNSTILE_SECRET_KEY/);
    delete process.env.NODE_ENV;
});
