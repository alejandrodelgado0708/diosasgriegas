import { db } from "@/lib/db";
import { distanceMeters } from "@/lib/http";

export class PunchError extends Error {
  constructor(message:string,public status:number=400) { super(message); }
}

export async function registerPunchAtLocation(userId:string,action:"in"|"out",lat?:unknown,lng?:unknown,enforceGeofence=true) {
  let nearest:{shop:any;distance:number}|null=null;
  let assignedShopId:number|null=null;
  if(enforceGeofence) {
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(Number(lat))>90||Math.abs(Number(lng))>180)throw new PunchError("Necesitamos una ubicacion valida para registrar la asistencia.");
    const shops=await db.shop.findMany({where:{active:true}});
    if(!shops.length)throw new PunchError("Todavia no hay locales con ubicacion configurada.",503);
    nearest=shops.map(shop=>({shop,distance:distanceMeters(Number(lat),Number(lng),shop.latitude,shop.longitude)})).sort((a,b)=>a.distance-b.distance)[0];
    if(nearest.distance>nearest.shop.radius)throw new PunchError(`Estas a ${Math.round(nearest.distance)} m del local mas cercano. Debes estar dentro de ${nearest.shop.radius} m de alguno de los locales.`,403);
    assignedShopId=nearest.shop.id;
  }
  if(!enforceGeofence) {
    const activeShops=await db.shop.findMany({where:{active:true},select:{id:true}});
    if(activeShops.length===1)assignedShopId=activeShops[0].id;
  }
  const open=await db.punch.findFirst({where:{userId,outAt:null},orderBy:{inAt:"desc"}});
  if(action==="in"&&open)throw new PunchError("Ya tenés una entrada abierta.",409);
  if(action==="out"&&!open)throw new PunchError("No hay una entrada abierta.",409);

  const userSchedule=action==="in"?await db.user.findUnique({where:{id:userId},select:{scheduledStartTime:true}}):null;
  const shopSchedule=action==="in"&&assignedShopId?await db.shop.findUnique({where:{id:assignedShopId},select:{scheduledStartTime:true}}):null;
  const punch=action==="in"
    ?await db.punch.create({data:{userId,shopId:assignedShopId,scheduledStartTime:userSchedule?.scheduledStartTime||shopSchedule?.scheduledStartTime||null}})
    :await db.punch.update({where:{id:open!.id},data:{outAt:new Date()}});
  return {punch,shop:nearest?.shop??null,distance:nearest?Math.round(nearest.distance):null};
}
