import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { error,isAdmin } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";
export async function PATCH(req:NextRequest) {const admin=await currentUser();if(!admin)return error("Iniciá sesión.",401);if(!isAdmin(admin))return error("Sin permiso.",403);const b=await req.json().catch(()=>null),id=Number(b?.shopId),lat=Number(b?.latitude),lng=Number(b?.longitude),radius=Number(b?.radius);if(!Number.isInteger(id)||id<1||!Number.isFinite(lat)||lat < -90||lat>90||!Number.isFinite(lng)||lng < -180||lng>180||!Number.isInteger(radius)||radius<30||radius>2000)return error("Ubicación inválida o radio fuera del rango de 30 a 2000 metros.");try{const shop=await db.shop.update({where:{id},data:{latitude:lat,longitude:lng,radius}});return NextResponse.json({shop});}catch{return error("No encontramos ese local.",404);}}
