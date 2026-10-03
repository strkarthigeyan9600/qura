import React, {createContext, useContext, useEffect, useState} from 'react';

export type User = {id: string; role: 'doctor'|'patient'|'admin'; name: string; email: string; language_pref: string; approved: number};
type Session = {user: User|null; loading: boolean; setUser: (user: User|null)=>void; logout: ()=>Promise<void>};
const Context=createContext<Session|null>(null);
let refreshing: Promise<Response>|null=null;

/** Same-origin credential transport; refresh access once without exposing tokens. */
export async function request<T=any>(path: string, body?: unknown, method?: string): Promise<T> {
  const options: RequestInit={credentials:'same-origin',method:method||(body!==undefined?'POST':'GET')};
  if(body instanceof FormData) options.body=body;
  else if(body!==undefined){options.headers={'Content-Type':'application/json'};options.body=JSON.stringify(body);}
  let response=await fetch('/api'+path,options);
  if(response.status===401&&(!path.startsWith('/auth/')||path==='/auth/me')){
    if(!refreshing) refreshing=fetch('/api/auth/refresh',{method:'POST',credentials:'same-origin'}).finally(()=>{refreshing=null;});
    const refresh=await refreshing;
    if(refresh.ok)response=await fetch('/api'+path,options);
    else window.dispatchEvent(new Event('qura-session-expired'));
  }
  let data:any;try{data=await response.json();}catch{throw new Error('The server returned an unexpected response. Please try again.');}
  if(!response.ok)throw new Error(typeof data.detail==='string'?data.detail:JSON.stringify(data.detail));
  return data as T;
}

/** Protect the full app until a real persisted session is resolved. */
export function SessionProvider({children}:{children:React.ReactNode}){
  const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true);
  useEffect(()=>{
    request<User>('/auth/me').then(setUser).catch(()=>{}).finally(()=>setLoading(false));
    const expire=()=>setUser(null);window.addEventListener('qura-session-expired',expire);
    return()=>window.removeEventListener('qura-session-expired',expire);
  },[]);
  const logout=async()=>{await request('/auth/logout',{});setUser(null);};
  return <Context.Provider value={{user,loading,setUser,logout}}>{children}</Context.Provider>;
}
export function useSession(){const value=useContext(Context);if(!value)throw Error('SessionProvider required');return value;}
