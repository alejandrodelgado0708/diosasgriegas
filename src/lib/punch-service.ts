import { db } from "@/lib/db";
import { distanceMeters } from "@/lib/http";

export class PunchError extends Error {
  constructor(message:string,public status:number=400) { super(message); }
}

export async function registerPunchAtLocation(userId:string,action:"in"|"out",lat:unknown,lng:unknown) {
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(Number(lat))>90||Math.abs(Number(lng))>180) {
    throw new PunchError("Necesitamos una ubicación válida para registrar la asistencia.");
  }
  const open=await db.punch.findFirst({where:{userId,outAt:null},orderBy:{inAt:"desc"}});
  if(action==="in"&&open)throw new PunchError("Ya tenés una entrada abierta.",409);
  if(action==="out"&&!open)throw new PunchError("No hay una entrada abierta.",409);

  const shops=await db.shop.findMany({where:{active:true}});
  if(!shops.length)throw new PunchError("Todavía no hay locales con ubicación configurada.",503);
  const nearest=shops.map(shop=>({shop,distance:distanceMeters(Number(lat),Number(lng),shop.latitude,shop.longitude)})).sort((a,b)=>a.distance-b.distance)[0];
  if(nearest.distance>nearest.shop.radius)throw new PunchError(`Estás a ${Math.round(nearest.distance)} m del local más cercano. Debés estar dentro de ${nearest.shop.radius} m de alguno de los locales.`,403);

  const punch=action==="in"
    ?await db.punch.create({data:{userId}})
    :await db.punch.update({where:{id:open!.id},data:{outAt:new Date()}});
  return {punch,shop:nearest.shop,distance:Math.round(nearest.distance)};
}
