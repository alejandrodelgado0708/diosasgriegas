import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { error,isAdmin } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}) {const admin=await currentUser();if(!admin)return error("Iniciá sesión.",401);if(!isAdmin(admin))return error("Sin permiso.",403);const b=await req.json().catch(()=>null),rate=Number(b?.hourlyRate);if(!Number.isFinite(rate)||rate<0)return error("La tarifa no puede ser negativa.");const {id}=await params;const result=await db.user.updateMany({where:{id,role:"vendedor"},data:{hourlyRate:rate}});return result.count?NextResponse.json({ok:true}):error("Vendedor no encontrado.",404);}
