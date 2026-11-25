import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { error,isAdmin } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";
export async function PATCH(req:NextRequest) {
  const admin=await currentUser();if(!admin)return error("Inicia sesion.",401);if(!isAdmin(admin))return error("Sin permiso.",403);
  const b=await req.json().catch(()=>null),id=Number(b?.shopId),lat=Number(b?.latitude),lng=Number(b?.longitude),radius=Number(b?.radius);
  const scheduleProvided=Object.prototype.hasOwnProperty.call(b||{},"scheduledExitTime");
  const scheduledExitTime=scheduleProvided?(String(b.scheduledExitTime||"").trim()||null):undefined;
  if(!Number.isInteger(id)||id<1||!Number.isFinite(lat)||lat < -90||lat>90||!Number.isFinite(lng)||lng < -180||lng>180||!Number.isInteger(radius)||radius<30||radius>2000)return error("Ubicacion invalida o radio fuera del rango de 30 a 2000 metros.");
  if(scheduledExitTime!==undefined&&scheduledExitTime!==null&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(scheduledExitTime))return error("Elegí una hora de salida válida.");
  try { const shop=await db.shop.update({where:{id},data:{latitude:lat,longitude:lng,radius,...(scheduleProvided?{scheduledExitTime}:{})}});return NextResponse.json({shop}); }catch{return error("No encontramos ese local.",404);}
}
