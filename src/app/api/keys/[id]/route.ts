import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request: Request): Promise<NextResponse> {
    const url = new URL(request.url);
    const idStr = url.pathname.split("/").pop();
    const id = Number(idStr);
    if(isNaN(id)){
        return NextResponse.json({error: "Invalid key ID"},{status:400})
    }

    try{
        const body = await request.json();
        const{
            type,
            zone,
            usage,
            keyname,
            keydescription,
            keytag,
            total_no_of_key,
        } = body;

        if(!type || !zone || !usage || !keyname || total_no_of_key === undefined){
            return NextResponse.json({error: "Missing required fields"}, {status:400})
        }
        return new Promise((resolve) => {
            db.run(
                `UPDATE keys SET type = ?, zone = ?, usage = ?, keyname =?, keydescription = ?, keytag = ?, total_no_of_key = ? WHERE id = ?`,
                [type, zone, usage, keyname, keydescription || "", keytag || "", total_no_of_key, id],
                function (err){
                    if(err){
                        console.error("SQLite keys update error:", err);
                        resolve(NextResponse.json({error: err.message}, {status: 500}))
                        return;
                    }
                    if(this.changes === 0){
                        resolve(NextResponse.json({error: "Key not found"}, {status:404}))
                        return;
                    }
                    resolve(
                        NextResponse.json({
                            id,
                            type,
                            zone,
                            usage,
                            keyname,
                            keydescription,
                            keytag,
                            total_no_of_key,
                        })
                    )
                }
            )
        })
    }catch{
        return NextResponse.json({error: "Invalid JSON"}, {status:400})
    }

}


export async function DELETE(request: Request): Promise<NextResponse> {
    const deleteUrl = new URL(request.url);
    const pathnameDelete = deleteUrl.pathname;
    const idStrDelete = pathnameDelete.split("/").pop();
    const id = Number(idStrDelete);
    if(isNaN(id)){
        return NextResponse.json({error: "Invalid ID"}, {status:400})
    }

    return new Promise((resolve) => {
        db.run("DELETE FROM keys WHERE id = ?", [id], function (err){
            if(err){
                console.error("Delete error:", err);
                resolve(NextResponse.json({error: err.message},{status: 500}))
                return;
            }
            if(this.changes === 0){
                resolve(NextResponse.json({error: "Record not found"}, {status: 404}))
                return;
            }
            resolve(NextResponse.json({message: "Delete successfully"}))
        })
    })
}