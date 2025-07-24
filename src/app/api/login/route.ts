import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
    const { username, password } = await request.json();

    if (username === 'admin' && password === '123456') {
        const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
        return NextResponse.json({ token });
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}

