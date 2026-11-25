import { db } from "@/lib/db";
import { makeSession,passwordMatches,sessionCookie,publicUser } from "@/lib/auth";
import { error,isDatabaseCredentialsInvalid,isDatabaseSchemaOutOfDate,isDatabaseUnavailable } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req:NextRequest) {
 try {
  if(!process.env.DATABASE_URL)return error("Falta configurar DATABASE_URL en el servidor.",503);
  if(!process.env.SESSION_SECRET)return error("Falta configurar SESSION_SECRET en el servidor.",503);
  const data=await req.json().catch(()=>null);
  const user=await db.user.findUnique({where:{username:String(data?.username||"").trim().toLowerCase()}});
  if(!user?.active||!passwordMatches(String(data?.password||""),user.passwordHash))return error("Usuario o contraseña incorrectos.",401);
  const res=NextResponse.json({user:publicUser(user)});res.cookies.set(sessionCookie(makeSession(user.id)));return res;
 } catch(cause) {
   if(isDatabaseUnavailable(cause))return error("No hay conexión con la base de datos. Revisá que el servidor esté disponible e intentá de nuevo.",503);
   if(isDatabaseCredentialsInvalid(cause))return error("La base de datos rechazó las credenciales de conexión. Revisá DATABASE_URL y DIRECT_URL en .env.",503);
   if(isDatabaseSchemaOutOfDate(cause))return error("La base de datos todavía no tiene las últimas actualizaciones. Cuando vuelva la conexión, ejecutá npm run db:deploy.",503);
   const code=cause&&typeof cause==="object"&&"code" in cause?(cause as {code?:unknown}).code:undefined;
   console.error("Login handler failed",{name:cause instanceof Error?cause.name:"UnknownError",code});
   return error("Error interno al iniciar sesión. Revisá el log del servidor para ver la causa.",500);
 }
}
