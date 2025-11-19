// Health Check Route Handler

export function health(req, res) {
  res.json({ status: "ok", timestamp: Date.now() });
}
