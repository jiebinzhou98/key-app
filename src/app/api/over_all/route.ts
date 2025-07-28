import db from "@/lib/db";
import { NextResponse } from "next/server";

type OverallRow = {
  id: number;
  type: string;
  zone: string;
  usage: string;
  keyname: string;
  keydescription: string;
  keytag: string;
  total_no_of_key: number;
  quantity: number;
  keyholder: string | null;
  division: string | null;
  ministry: string | null;
};

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
    const rows = await new Promise<OverallRow[]>((resolve, reject) => {
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as OverallRow[]);
      });
    });

    return NextResponse.json(rows);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }else{
      return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
    }
  }
}
