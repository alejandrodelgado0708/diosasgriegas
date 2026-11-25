import { currentUser } from "@/lib/auth";
import { registerPunchAtLocation,PunchError } from "@/lib/punch-service";
import { closeDuePunches } from "@/lib/auto-checkout";
import { error } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req:NextRequest) {
  const user=await currentUser();if(!user)return error("Iniciá sesión.",401);
  if(user.role!=="vendedor")return error("Solo los vendedores pueden fichar.",403);
  const b=await req.json().catch(()=>null);
  if(!["in","out"].includes(b?.action))return error("Acción de fichaje inválida.");
  if(b.action==="out")return error("Las salidas manuales las registra administracion.",403);
  try {
    await closeDuePunches(new Date(),user.id);
    const result=await registerPunchAtLocation(user.id,b.action,b.lat,b.lng,b.action==="in");
    return NextResponse.json({ok:true,...result},{status:201});
  } catch(e) {
    if(e instanceof PunchError)return error(e.message,e.status);
    throw e;
  }
}
