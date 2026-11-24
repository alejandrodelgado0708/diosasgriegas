import { db } from "@/lib/db";
import { makeSession,passwordHash,sessionCookie,publicUser } from "@/lib/auth";
import { error } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req:NextRequest) { const data=await req.json().catch(()=>null);if(!data?.name||!data?.username||String(data.password||"").length<5)return error("Completá nombre, usuario y una contraseña de al menos 5 caracteres.");if(await db.user.count({where:{role:"administrador"}}))return error("La configuración inicial ya se realizó.",409);const user=await db.user.create({data:{name:String(data.name).trim(),username:String(data.username).trim().toLowerCase(),passwordHash:passwordHash(String(data.password)),role:"administrador"}});const res=NextResponse.json({user:publicUser(user)},{status:201});res.cookies.set(sessionCookie(makeSession(user.id)));return res; }
