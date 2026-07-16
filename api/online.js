"use strict";

/* =====================================================================
   Contador de pessoas online — Mapa do Fies (ProFies)
   Função serverless (Vercel). Guarda apenas sessões anônimas ativas
   numa janela de tempo. NÃO grava nome, e-mail, telefone, nota do Enem,
   buscas nem IP. Privacidade preservada.

   Requer duas variáveis de ambiente (configuradas na Vercel):
     UPSTASH_REDIS_REST_URL
     UPSTASH_REDIS_REST_TOKEN
   ===================================================================== */

/* ---- CONFIG: domínios do SEU site autorizados a consultar o contador ----
   Coloque aqui o(s) endereço(s) exato(s) onde o Mapa do Fies é aberto.
   Aceitos automaticamente também: *.vercel.app, *.github.io e localhost. */
const ALLOWED_HOSTS = [
  "mapadofies.com.br",
  "www.mapadofies.com.br",
  "mapadofies.com",
  "www.mapadofies.com",
  "mapa.fies.com.br",
  "fies.com.br",
  "www.fies.com.br"
];

const ACTIVE_WINDOW_MS = 75 * 1000;         // "online" = ativo nos últimos 75s
const REDIS_KEY = "mapadofies:online";
const SESSION_PATTERN = /^[a-zA-Z0-9_-]{16,80}$/;

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

function hostFromOrigin(origin) {
  try { return new URL(origin).hostname.toLowerCase(); } catch { return null; }
}

function isAllowedHost(host) {
  if (!host) return false;
  if (ALLOWED_HOSTS.includes(host)) return true;
  if (host.endsWith(".vercel.app") || host.endsWith(".github.io")) return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return false;
}

module.exports = async function onlineHandler(req, res) {
  const origin = req.headers.origin;
  const host = origin ? hostFromOrigin(origin) : null;
  const allowed = !origin || isAllowedHost(host);

  // CORS: como site e função podem ficar em domínios diferentes, devolvemos a
  // origem autorizada e respondemos ao preflight (OPTIONS).
  if (origin && allowed) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }
  if (!allowed) {
    return res.status(403).json({ error: "Origem não permitida." });
  }

  const { sessionId } = readBody(req);
  if (typeof sessionId !== "string" || !SESSION_PATTERN.test(sessionId)) {
    return res.status(400).json({ error: "Sessão inválida." });
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!redisUrl || !redisToken) {
    return res.status(503).json({ error: "Contador ainda não configurado." });
  }

  const now = Date.now();
  const cutoff = now - ACTIVE_WINDOW_MS;
  const commands = [
    ["ZADD", REDIS_KEY, now, sessionId],
    ["ZREMRANGEBYSCORE", REDIS_KEY, 0, cutoff],
    ["ZCOUNT", REDIS_KEY, cutoff, "+inf"],
    ["EXPIRE", REDIS_KEY, 180]
  ];

  try {
    const response = await fetch(redisUrl.replace(/\/+$/, "") + "/pipeline", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + redisToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(commands)
    });
    if (!response.ok) throw new Error("Falha no armazenamento.");
    const results = await response.json();
    const online = Number(results?.[2]?.result);
    if (!Number.isInteger(online) || online < 0) throw new Error("Resposta inválida.");
    return res.status(200).json({ online });
  } catch {
    return res.status(503).json({ error: "Contador temporariamente indisponível." });
  }
};
