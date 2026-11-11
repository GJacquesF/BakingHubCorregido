export async function verificarTurnstile(token, remoteIp = null) {
    const secret = (process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ?? "").trim();
    if (!secret) return true;

    const valor = typeof token === "string" ? token.trim() : "";
    if (!valor) throw new Error("Captcha requerido");

    const body = new URLSearchParams({ secret, response: valor });
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
        const errores = Array.isArray(data["error-codes"]) ? data["error-codes"] : [];
        throw new Error(errores.length ? errores.join(", ") : "No se pudo verificar el captcha");
    }

    return true;
}
