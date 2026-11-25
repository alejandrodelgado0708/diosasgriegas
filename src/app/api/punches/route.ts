import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdmin,error } from "@/lib/http";
import { localMidnightUtc,periodBounds,PunchPeriod } from "@/lib/periods";
import { NextRequest,NextResponse } from "next/server";

export async function GET(req:NextRequest) {
  const user=await currentUser();if(!user)return error("Iniciá sesión.",401);
  const raw=req.nextUrl.searchParams.get("period")||"week";
  if(!["week","fortnight","month"].includes(raw))return error("Período inválido.");
  const bounds=periodBounds(raw as PunchPeriod,req.nextUrl.searchParams.get("date")||undefined);
  const admin=isAdmin(user),requestedUser=req.nextUrl.searchParams.get("userId");
  const userId=admin?(requestedUser||undefined):user.id;
  if(requestedUser&&!admin)return error("Solo administración puede filtrar por vendedor.",403);
  const punches=await db.punch.findMany({where:{...(userId?{userId}:{}),inAt:{gte:localMidnightUtc(bounds.start),lt:localMidnightUtc(bounds.end)}},include:{user:{select:{name:true,id:true}},shop:{select:{name:true}}},orderBy:{inAt:"desc"}});
  return NextResponse.json({period:raw,...bounds,punches:punches.map(p=>({...p,userName:p.user.name,shopName:p.shop?.name||""}))});
}
