import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { error,isAdmin } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";

export async function DELETE(_req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const admin=await currentUser();
  if(!admin)return error("Inicia sesion.",401);
  if(!isAdmin(admin))return error("Sin permiso.",403);
  const {id:rawId}=await params,id=Number(rawId);
  if(!Number.isInteger(id)||id<1)return error("Sucursal no encontrada.",404);
  const result=await db.shop.updateMany({where:{id,active:true},data:{active:false}});
  return result.count?NextResponse.json({ok:true}):error("Sucursal no encontrada.",404);
}
