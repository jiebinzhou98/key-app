import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(
    request: Request, {params}: {params: {id: string}}
): Promise<NextResponse>{
    const id = Number(params.id);
    if(isNaN(id)){
        return NextResponse.json({error: "Invalid user ID"},{status:400})
    }

    try{
        const body = await request.json();
        const {name, division, ministry} = body;

        if(!name){
            return NextResponse.json({error: "Name is required"}, {status: 400})
        }

        return new Promise((resolve) =>{
            db.run(
                `UPDATE users SET name = ?, division = ?, ministry = ? WHERE id = ?`,
                [name, division || "", ministry || "", id],
                function(err){
                    if(err){
                        console.error("SQLite users update error:", err);
                        resolve(NextResponse.json({error: err.message}, {status:500}));
                        return;
                    }
                    if (this.changes === 0){
                        resolve(NextResponse.json({error: "User not found"}, {status: 404}))
                        return;
                    }
                    resolve(NextResponse.json({id, name,division,ministry}));
                }
            )
        })
    }catch{
        return NextResponse.json({error: "Invalid JSON"}, {status:400})
    }
}

export async function DELETE (
    request: Request,
    {params} : {params :{id: string}}
){
    const id = Number(params.id);
    if(isNaN(id)){
        return NextResponse.json({error: "Invalid ID"}, {status: 400})
    }

    return new Promise((resolve) => {
        db.run("DELETE FROM users WHERE id = ?", [id], function (err){
            if(err){
                console.error("Delete error:", err)
                resolve(NextResponse.json({error: err.message}, {status:500}))
                return;
            }
            if(this.changes === 0){
                resolve(NextResponse.json({error: "Reocrd not found"}, {status: 404}))
                return;
            }
            resolve(NextResponse.json({message: "Deleted successfully"}))
        })
    })
}