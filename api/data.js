const { put, list, del } = require("@vercel/blob");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Check password (accepts either user's password)
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const validPasswords = [
    process.env.DASHBOARD_PASSWORD,
    process.env.DASHBOARD_PASSWORD_2
  ].filter(Boolean);

  if (!token || !validPasswords.includes(token)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const blobName = "finanz-data.json";

  try {
    if (req.method === "GET") {
      const { blobs } = await list({ prefix: blobName });
      if (blobs.length === 0) return res.status(404).json({ error: "no data" });
      const response = await fetch(blobs[0].url);
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const { blobs } = await list({ prefix: blobName });
      for (const blob of blobs) await del(blob.url);
      await put(blobName, body, { access: "public", contentType: "application/json", addRandomSuffix: false });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    console.error("Blob API error:", err);
    return res.status(500).json({ error: err.message });
  }
};
