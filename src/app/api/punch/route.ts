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
    const phone=String(process.env.WHATSAPP_PUNCH_PHONE|| (process.env.NODE_ENV==="production"?"5491144292660":"5491135118731")).replace(/\D/g,"");
    const time=new Intl.DateTimeFormat("es-AR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Argentina/Buenos_Aires"}).format(result.punch.inAt);
    const message=`${user.name} registró su entrada a las ${time}.`;
    const whatsappUrl=`https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    return NextResponse.json({ok:true,...result,whatsappUrl},{status:201});
  } catch(e) {
    if(e instanceof PunchError)return error(e.message,e.status);
    throw e;
  }
}
