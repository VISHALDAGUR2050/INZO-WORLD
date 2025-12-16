export default function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).send("INZO WORLD SERVER IS LIVE ✅");
  }

  res.status(405).json({ error: "Method not allowed" });
}