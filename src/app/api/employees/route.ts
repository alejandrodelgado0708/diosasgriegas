import { currentUser,passwordHash,publicUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { error,isAdmin } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req:NextRequest) {
  const admin=await currentUser();if(!admin)return error("Iniciá sesión.",401);if(!isAdmin(admin))return error("Sin permiso.",403);
  const b=await req.json().catch(()=>null);const name=String(b?.name||"").trim(),username=String(b?.username||"").trim().toLowerCase(),password=String(b?.password||""),rate=Number(b?.hourlyRate);
  if(!name||!username||password.length<8||!Number.isFinite(rate)||rate<0)return error("Revisá los datos. La contraseña debe tener 8 caracteres o más y la tarifa no puede ser negativa.");
  try { const user=await db.user.create({data:{name,username,passwordHash:passwordHash(password),hourlyRate:rate,role:"vendedor"}});return NextResponse.json({user:publicUser(user)},{status:201}); }catch{return error("Ese nombre de usuario ya está registrado.",409);}
}
