import db from "@/lib/db"
import { NextResponse } from "next/server"

const SPARE_USER_ID = 87;

export async function GET(): Promise<NextResponse> {

    return new Promise((resolve) => {
        const sql = `SELECT 
                        ak.id,
                        ak.user_id,
                        ak.key_id,
                        ak.quantity,
                        u.name AS keyholder,
                        k.keyname
                        FROM assign_key ak
                        LEFT JOIN users u ON ak.user_id = u.id
                        LEFT JOIN keys k ON ak.key_id = k.id`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error("SQLite information error:", err)
                resolve(
                    NextResponse.json(
                        { error: err.message },
                        { status: 500 }
                    )
                );
                return;
            }
            resolve(NextResponse.json(rows))
        });
    });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { user_id, key_id, quantity } = body;

    if (
      typeof user_id !== "number" ||
      typeof key_id !== "number" ||
      typeof quantity !== "number"
    ) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return new Promise((resolve) => {
      function checkSpareAndProceed() {
        db.get(
          `SELECT quantity FROM assign_key WHERE user_id = ? AND key_id = ?`,
          [SPARE_USER_ID, key_id],
          (err, spareRow: { quantity?: number } | undefined) => {
            if (err) {
              console.error("Spare key lookup error:", err);
              resolve(NextResponse.json({ error: "Error checking spare key quantity" }, { status: 500 }));
              return;
            }

            const spareQuantity = spareRow?.quantity ?? 0;

            if (spareQuantity < quantity) {
              resolve(NextResponse.json({ error: "Insufficient spare key quantity" }, { status: 400 }));
              return;
            }

            db.get("SELECT name FROM users WHERE id = ?", [user_id], (err, userRow: { name: string } | undefined) => {
              if (err || !userRow) {
                console.error("User lookup error:", err);
                resolve(NextResponse.json({ error: "User not found" }, { status: 400 }));
                return;
              }

              db.get("SELECT keyname FROM keys WHERE id = ?", [key_id], (err, keyRow: { keyname: string } | undefined) => {
                if (err || !keyRow) {
                  console.error("Key lookup error:", err);
                  resolve(NextResponse.json({ error: "Key not found" }, { status: 400 }));
                  return;
                }

                db.run(
                  `INSERT INTO assign_key (user_id, key_id, quantity, keyholder, keyname) VALUES (?, ?, ?, ?, ?)`,
                  [user_id, key_id, quantity, userRow.name, keyRow.keyname],
                  function (err) {
                    if (err) {
                      console.error("SQLite insert error:", err);
                      resolve(NextResponse.json({ error: err.message }, { status: 500 }));
                      return;
                    }

                    db.run(
                      `UPDATE assign_key SET quantity = quantity - ? WHERE user_id = ? AND key_id = ?`,
                      [quantity, SPARE_USER_ID, key_id],
                      (updateErr) => {
                        if (updateErr) {
                          console.error("Error updating spare key quantity:", updateErr);
                        }

                        resolve(
                          NextResponse.json(
                            {
                              id: this.lastID,
                              user_id,
                              key_id,
                              quantity,
                              keyholder: userRow.name,
                              keyname: keyRow.keyname,
                            },
                            { status: 201 }
                          )
                        );
                      }
                    );
                  }
                );
              });
            });
          }
        );
      }

      db.get(
        `SELECT 1 FROM assign_key WHERE user_id = ? AND key_id = ?`,
        [SPARE_USER_ID, key_id],
        (err, row) => {
          if (err) {
            console.error("Spare key existence check error:", err);
            resolve(NextResponse.json({ error: "Error checking spare key existence" }, { status: 500 }));
            return;
          }

          if (!row) {
            db.run(
              `INSERT INTO assign_key (user_id, key_id, quantity, keyholder, keyname) VALUES (?, ?, 0, 'Spare', 'Spare Key')`,
              [SPARE_USER_ID, key_id],
              (insertErr) => {
                if (insertErr) {
                  console.error("Error inserting spare key record:", insertErr);
                  resolve(NextResponse.json({ error: "Failed to create spare key record" }, { status: 500 }));
                  return;
                }
                checkSpareAndProceed();
              }
            );
          } else {
            checkSpareAndProceed();
          }
        }
      );
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}