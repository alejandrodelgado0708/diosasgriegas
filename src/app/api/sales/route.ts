import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { error,isAdmin } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req:NextRequest) {const admin=await currentUser();if(!admin)return error("Iniciá sesión.",401);if(!isAdmin(admin))return error("Sin permiso.",403);const b=await req.json().catch(()=>null),count=Number(b?.count),date=String(b?.date||"");if(!b?.userId||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(count)||count<0||count>500)return error("Revisá vendedor, fecha y cantidad.");if(!await db.user.findFirst({where:{id:b.userId,role:"vendedor",active:true}}))return error("Vendedor no encontrado.",404);const sale=await db.dailySale.upsert({where:{userId_date:{userId:b.userId,date}},create:{userId:b.userId,date,count},update:{count}});return NextResponse.json({ok:true,sale,commission:Math.max(0,count-14)*500});}
