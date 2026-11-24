import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { distanceMeters,error } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req:NextRequest) {
  const user=await currentUser();if(!user)return error("Iniciá sesión.",401);if(user.role!=="vendedor")return error("Solo los vendedores pueden marcar asistencia.",403);
  const b=await req.json().catch(()=>null);if(!["in","out"].includes(b?.action)||!Number.isFinite(b.lat)||!Number.isFinite(b.lng)||Math.abs(b.lat)>90||Math.abs(b.lng)>180)return error("Necesitamos una ubicación válida para registrar la asistencia.");
  const open=await db.punch.findFirst({where:{userId:user.id,outAt:null},orderBy:{inAt:"desc"}});
  if(b.action==="in"&&open)return error("Ya tenés una entrada abierta.",409);if(b.action==="out"&&!open)return error("No hay una entrada abierta.",409);
  const shops=await db.shop.findMany({where:{active:true}});if(!shops.length)return error("Todavía no hay locales con ubicación configurada.",503);
  const distances=shops.map(shop=>({shop,distance:distanceMeters(b.lat,b.lng,shop.latitude,shop.longitude)})).sort((a,b)=>a.distance-b.distance);
  const nearest=distances[0];if(nearest.distance>nearest.shop.radius)return error(`Estás a ${Math.round(nearest.distance)} m del local más cercano. Debés estar dentro de ${nearest.shop.radius} m de alguno de los locales.`,403);
  const punch=b.action==="in"?await db.punch.create({data:{userId:user.id}}):await db.punch.update({where:{id:open!.id},data:{outAt:new Date()}});
  return NextResponse.json({ok:true,punch},{status:201});
}
