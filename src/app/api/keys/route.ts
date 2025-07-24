import db from "@/lib/db"
import { error } from "console";
import { NextResponse } from "next/server"
import { resolve } from "path";

const SPARE_USER_ID = 87;

export async function GET(): Promise<NextResponse>{
    return new Promise((resolve) => {
        db.all("SELECT * FROM keys", [], (err, rows) => {
            if(err) {
                console.error("SQLite keys error:", err)
                resolve(
                    NextResponse.json(
                        {error: err.message},
                        {status: 500}
                    )
                );
                return;
            }
            resolve(NextResponse.json(rows))
        })
    });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      type,
      zone,
      usage,
      keyname,
      keydescription,
      keytag,
      total_no_of_key,
    } = body;

    if (
      !type ||
      !zone ||
      !usage ||
      !keyname ||
      total_no_of_key === undefined
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    return new Promise((resolve) => {
      db.run(
        `INSERT INTO keys (type, zone, usage, keyname, keydescription, keytag, total_no_of_key)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [type, zone, usage, keyname, keydescription || "", keytag || "", total_no_of_key],
        function (err) {
          if (err) {
            console.error("SQLite keys POST error:", err);
            resolve(NextResponse.json({ error: err.message }, { status: 500 }));
            return;
          }

          const newKeyId = this.lastID;

          db.run(
            `INSERT INTO assign_key (user_id, key_id, quantity, keyholder, keyname)
             VALUES (?, ?, ?, ?, ?)`,
            [
              SPARE_USER_ID,           
              newKeyId,
              total_no_of_key,         
              "Spare",                 
              keyname,
            ],
            (assignErr) => {
              if (assignErr) {
                console.error("Error initializing spare inventory:", assignErr);
              }
              resolve(
                NextResponse.json({ id: newKeyId }, { status: 201 })
              );
            }
          );
        }
      );
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
