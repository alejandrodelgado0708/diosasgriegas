import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { distanceMeters,error } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";

// Temporary test: picks the nearest shop without enforcing its geofence or recording attendance.
export async function POST(req:NextRequest) {
  const user=await currentUser();
  if(!user)return error("Iniciá sesión.",401);
  if(user.role!=="vendedor")return error("Solo los vendedores pueden probar el mensaje.",403);

  const b=await req.json().catch(()=>null);
  if(!Number.isFinite(b?.lat)||!Number.isFinite(b?.lng)||Math.abs(b.lat)>90||Math.abs(b.lng)>180)return error("Necesitamos una ubicación válida para identificar el local más cercano.");

  const shops=await db.shop.findMany({where:{active:true}});
  if(!shops.length)return error("Todavía no hay locales configurados.",503);
  const nearest=shops.map(shop=>({shop,distance:distanceMeters(b.lat,b.lng,shop.latitude,shop.longitude)})).sort((a,b)=>a.distance-b.distance)[0];
  return NextResponse.json({ok:true,shop:{name:nearest.shop.name,address:nearest.shop.address},distance:Math.round(nearest.distance)});
}
