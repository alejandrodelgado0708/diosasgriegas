import { db } from "@/lib/db";
import { makeSession,passwordMatches,sessionCookie,publicUser } from "@/lib/auth";
import { error } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req:NextRequest) { const data=await req.json().catch(()=>null);const user=await db.user.findUnique({where:{username:String(data?.username||"").trim().toLowerCase()}});if(!user?.active||!passwordMatches(String(data?.password||""),user.passwordHash))return error("Usuario o contraseña incorrectos.",401);const res=NextResponse.json({user:publicUser(user)});res.cookies.set(sessionCookie(makeSession(user.id)));return res; }
