'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage(){
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent){
        e.preventDefault();
        const res = await fetch('/api/login',{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password}),
        });
        const data = await res.json();
        if (res.ok && data.token){
            localStorage.setItem('token',data.token);
            router.push('/');
        }else{
            alert('Login failed: ' + (data.error || 'Unknow Error'));
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-sm mx-auto p-4 mt-20 border rounded">
            <h1 className="text-xl mb-4">Login</h1>
            <input type="text" 
                className="mb-2 w-full p-2 border rounded"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
            />
            <input
                className="mb-4 w-full p-2 border rounded"
                placeholder="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">Login</button>
        </form>
    )
}