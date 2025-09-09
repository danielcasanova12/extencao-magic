// api/statusinvest-latest.ts
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon usa SSL; Vercel function roda em Node 18+
  ssl: { rejectUnauthorized: false }
});

function cors(res: any) {
  // Permite StatusInvest e sua extensão
  const origin = res.req?.headers?.origin || "*";
  const allowed = [
    "https://statusinvest.com.br",
    "https://www.statusinvest.com.br",
    "chrome-extension://", // vai casar com qualquer extensão
    "http://localhost:3000"
  ];
  const allowOrigin = allowed.some(a => origin?.startsWith(a)) ? origin : allowed[0];
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // Ajuste os campos conforme seu schema real
    // Exemplo comum: ticker, price, updated_at
    const q = `
      SELECT
        ticker,
        price,
        roic_pct,
        earning_yield,
        market_cap,
        sector,
        updated_at
      FROM statusinvest_latest
      ORDER BY updated_at DESC
      LIMIT 1000;
    `;
    const { rows } = await pool.query(q);
    res.status(200).json({ ok: true, rows });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
}
