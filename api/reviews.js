const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "site", "data", "avis.json");

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function clean(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function readBody(req) {
  if (typeof req.body === "string") {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch (error) {
      return Promise.resolve(null);
    }
  }
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        resolve(null);
      }
    });
  });
}

function supabase() {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return null;
  return {
    endpoint: `${base.replace(/\/$/, "")}/rest/v1/avis`,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  };
}

function readFileStore() {
  try {
    const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function writeFileStore(rows) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(rows, null, 2));
}

function validate(body) {
  if (!body || typeof body !== "object") return "Le formulaire est incomplet.";
  if (clean(body.website, 80)) return "honeypot";
  const prenom = clean(body.prenom, 40);
  const lieu = clean(body.lieu, 40);
  const message = clean(body.message, 600);
  const note = Number(body.note);
  if (prenom.length < 2) return "Indiquez votre prénom.";
  if (![1, 2, 3, 4, 5].includes(note)) return "Choisissez une note de 1 à 5.";
  if (message.length < 12) return "Le message doit faire au moins quelques mots.";
  if (body.publication !== true) return "Cochez la case pour publier l'avis sur la page.";
  return { prenom, lieu, note, message };
}

module.exports = async (req, res) => {
  const store = supabase();
  const local = !process.env.VERCEL;

  if (req.method === "GET") {
    if (store) {
      const response = await fetch(`${store.endpoint}?select=id,prenom,lieu,note,message,created_at&order=created_at.desc&limit=60`, {
        headers: store.headers,
      });
      if (!response.ok) return send(res, 502, { error: "Impossible de lire les avis." });
      return send(res, 200, { avis: await response.json() });
    }
    if (local) return send(res, 200, { avis: readFileStore() });
    return send(res, 503, { error: "Le stockage des avis n'est pas configuré." });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "Méthode refusée." });
  }

  const body = await readBody(req);
  const checked = validate(body);
  if (checked === "honeypot") return send(res, 201, { ok: true });
  if (typeof checked === "string") return send(res, 400, { error: checked });

  const row = {
    id: crypto.randomUUID(),
    ...checked,
    created_at: new Date().toISOString(),
  };

  if (store) {
    const same = await fetch(
      `${store.endpoint}?prenom=eq.${encodeURIComponent(row.prenom)}&message=eq.${encodeURIComponent(row.message)}&select=id&limit=1`,
      { headers: store.headers }
    );
    if (same.ok) {
      const existing = await same.json();
      if (Array.isArray(existing) && existing.length) {
        return send(res, 409, { error: "Cet avis est déjà enregistré." });
      }
    }
    const response = await fetch(store.endpoint, {
      method: "POST",
      headers: { ...store.headers, Prefer: "return=representation" },
      body: JSON.stringify({
        prenom: row.prenom,
        lieu: row.lieu,
        note: row.note,
        message: row.message,
      }),
    });
    if (!response.ok) return send(res, 502, { error: "L'avis n'a pas pu être enregistré." });
    const saved = await response.json();
    return send(res, 201, { avis: Array.isArray(saved) ? saved[0] : saved });
  }

  if (!local) return send(res, 503, { error: "Le stockage des avis n'est pas configuré." });

  const rows = readFileStore();
  if (rows.some((item) => item.prenom === row.prenom && item.message === row.message)) {
    return send(res, 409, { error: "Cet avis est déjà enregistré." });
  }
  rows.unshift(row);
  writeFileStore(rows.slice(0, 60));
  return send(res, 201, { avis: row });
};
