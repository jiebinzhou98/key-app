import db from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(): Promise<NextResponse>{
    return new Promise((resolve) => {
        db.all("SELECT * FROM users", [], (err, rows) => {
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
    try{
        const body = await request.json();
        const {name, division, ministry} = body;

        if(!name){
            return NextResponse.json({error: "Mission required fields"}, {status: 400})
        }

        return new Promise((resolve) => {
            db.run(
                `INSERT INTO users (name, division, ministry) VALUES(?,?,?)`,
                [name, division || "", ministry || ""],
                function(err){
                    if(err){
                        console.error("SQLite users POST error:", err)
                        resolve(NextResponse.json({error:err.message}, {status:500}))
                        return;
                    }
                    resolve(
                        NextResponse.json({id: this.lastID}, {status:200})
                    );
                }
            );
        });
    }catch{
        return NextResponse.json({error: "Invalid JSON"}, {status:400})
    }
}