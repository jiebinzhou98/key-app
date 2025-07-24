import db from "@/lib/db";
import { NextResponse } from "next/server";

const SPARE_USER_ID = 87;

async function ensureSpareStockExists(key_id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 1 FROM assign_key WHERE user_id = ? AND key_id = ?`,
      [SPARE_USER_ID, key_id],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          db.run(
            `INSERT INTO assign_key (user_id, key_id, quantity, keyholder, keyname) VALUES (?, ?, 0, 'Spare', 'Spare Key')`,
            [SPARE_USER_ID, key_id],
            (insertErr) => {
              if (insertErr) {
                reject(insertErr);
                return;
              }
              resolve();
            }
          );
        } else {
          resolve();
        }
      }
    );
  });
}


export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
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

    return new Promise(async (resolve) => {
      try {
        await ensureSpareStockExists(key_id);
      } catch (e) {
        console.error("Error ensuring spare stock exists:", e);
        resolve(NextResponse.json({ error: "Error ensuring spare stock" }, { status: 500 }));
        return;
      }

      db.get(
        "SELECT key_id as old_key_id, quantity as old_quantity FROM assign_key WHERE id = ?",
        [id],
        (err, oldAssign: { old_key_id: number; old_quantity: number } | undefined) => {
          if (err || !oldAssign) {
            resolve(NextResponse.json({ error: "Record not found" }, { status: 404 }));
            return;
          }

          function updateSpareKeyQuantity(keyId: number, diff: number, callback: (err?: Error) => void) {
            db.run(
              `UPDATE assign_key SET quantity = quantity + ? WHERE user_id = ? AND key_id = ?`,
              [diff, SPARE_USER_ID, keyId],
              (err) => {
                callback(err ?? undefined);
              }
            );
          }

          if (oldAssign.old_key_id === key_id) {
            const diff = oldAssign.old_quantity - quantity;
            updateSpareKeyQuantity(key_id, diff, (err) => {
              if (err) {
                resolve(NextResponse.json({ error: err.message }, { status: 500 }));
                return;
              }
              updateAssign();
            });
          } else {
            ensureSpareStockExists(key_id).then(() => {
              updateSpareKeyQuantity(oldAssign.old_key_id, oldAssign.old_quantity, (err) => {
                if (err) {
                  resolve(NextResponse.json({ error: err.message }, { status: 500 }));
                  return;
                }
                updateSpareKeyQuantity(key_id, -quantity, (err) => {
                  if (err) {
                    resolve(NextResponse.json({ error: err.message }, { status: 500 }));
                    return;
                  }
                  updateAssign();
                });
              });
            }).catch(e => {
              console.error("Error ensuring spare stock exists:", e);
              resolve(NextResponse.json({ error: "Error ensuring spare stock" }, { status: 500 }));
            });
          }

          function updateAssign() {
            db.get("SELECT name FROM users WHERE id = ?", [user_id], (err, userRow: { name?: string } | undefined) => {
              if (err || !userRow || !userRow.name) {
                resolve(NextResponse.json({ error: "User not found" }, { status: 400 }));
                return;
              }
              db.get("SELECT keyname FROM keys WHERE id = ?", [key_id], (err, keyRow: { keyname?: string } | undefined) => {
                if (err || !keyRow || !keyRow.keyname) {
                  resolve(NextResponse.json({ error: "Key not found" }, { status: 400 }));
                  return;
                }
                db.run(
                  `UPDATE assign_key SET user_id = ?, key_id = ?, quantity = ?, keyholder = ?, keyname = ? WHERE id = ?`,
                  [user_id, key_id, quantity, userRow.name, keyRow.keyname, id],
                  function (err) {
                    if (err) {
                      resolve(NextResponse.json({ error: err.message }, { status: 500 }));
                      return;
                    }
                    if (this.changes === 0) {
                      resolve(NextResponse.json({ error: "Record not found" }, { status: 404 }));
                      return;
                    }
                    resolve(
                      NextResponse.json({
                        id,
                        user_id,
                        key_id,
                        quantity,
                        keyholder: userRow.name,
                        keyname: keyRow.keyname,
                      })
                    );
                  }
                );
              });
            });
          }
        }
      );
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  return new Promise(async (resolve) => {
    db.get("SELECT key_id, quantity FROM assign_key WHERE id = ?", [id], async (err, assign: { key_id: number; quantity: number } | undefined) => {
      if (err || !assign) {
        resolve(NextResponse.json({ error: "Record not found" }, { status: 404 }));
        return;
      }

      try {
        await ensureSpareStockExists(assign.key_id);
      } catch (e) {
        console.error("Error ensuring spare stock exists:", e);
        resolve(NextResponse.json({ error: "Error ensuring spare stock" }, { status: 500 }));
        return;
      }

      db.run("DELETE FROM assign_key WHERE id = ?", [id], function (err) {
        if (err) {
          resolve(NextResponse.json({ error: err.message }, { status: 500 }));
          return;
        }
        if (this.changes === 0) {
          resolve(NextResponse.json({ error: "Record not found" }, { status: 404 }));
          return;
        }

        db.run(
          `UPDATE assign_key SET quantity = quantity + ? WHERE user_id = ? AND key_id = ?`,
          [assign.quantity, SPARE_USER_ID, assign.key_id],
          (err) => {
            if (err) {
              resolve(NextResponse.json({ error: err.message }, { status: 500 }));
              return;
            }
            resolve(NextResponse.json({ message: "Deleted successfully" }));
          }
        );
      });
    });
  });
}
