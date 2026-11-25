import { currentUser } from "@/lib/auth";
import { closeDuePunches } from "@/lib/auto-checkout";
import { db } from "@/lib/db";
import { error,isAdmin } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";

export async function POST(req:NextRequest) {
  const admin=await currentUser();
  if(!admin)return error("Iniciá sesión.",401);
  if(!isAdmin(admin))return error("Sin permiso.",403);
  const body=await req.json().catch(()=>null);
  const all=body?.all===true;
  const userId=typeof body?.userId==="string"?body.userId:"";
  if(all===!!userId)return error("Elegí una vendedora o todas las entradas abiertas.");

  if(userId) {
    const employee=await db.user.findFirst({where:{id:userId,role:"vendedor"},select:{id:true}});
    if(!employee)return error("Vendedora no encontrada.",404);
  }

  const automatic=await closeDuePunches(new Date(),userId||undefined);
  const open=await db.punch.findMany({
    where:{outAt:null,...(userId?{userId}:{}),user:{is:{role:"vendedor"}}},
    select:{id:true},
  });
  if(!open.length)return NextResponse.json({ok:true,closed:0,automatic});
  const result=await db.punch.updateMany({
    where:{id:{in:open.map(p=>p.id)},outAt:null},
    data:{outAt:new Date(),autoClosed:false},
  });
  return NextResponse.json({ok:true,closed:result.count,automatic});
}
