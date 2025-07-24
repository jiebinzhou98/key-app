import { useState,useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthGuard(){
    const [authChecked, setAuthChecked] = useState(false);
    const router = useRouter();

    useEffect(() =>{
        async function checkAuth() {
            const token = localStorage.getItem('token');
            if(!token){
                router.push('/login')
                return;
            }

            const res = await fetch('/api/check-auth', {
                headers: {'Authorization': `Bearer ${token}`},
            });
            if(!res.ok){
                router.push('/login');
                return;
            }
            setAuthChecked(true);
        }
        checkAuth();
    }, [router]);
    return authChecked;
}