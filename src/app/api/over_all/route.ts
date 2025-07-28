// src/app/api/over_all/route.ts
import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const sql = `
      SELECT
        k.id,
        k.type,
        k.zone,
        k.usage,
        k.keyname,
        k.keydescription,
        k.keytag,
        k.total_no_of_key,
        IFNULL(ak.quantity, 0) AS quantity,
        u.name AS keyholder,
        u.division,
        u.ministry
      FROM keys k
      LEFT JOIN assign_key ak ON k.id = ak.key_id
      LEFT JOIN users u ON ak.user_id = u.id
      ORDER BY k.id, u.name
    `;
  try {
    const rows = await new Promise<any[]>((resolve, reject) => {
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
