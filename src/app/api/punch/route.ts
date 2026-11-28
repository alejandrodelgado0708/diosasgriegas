import { currentUser } from "@/lib/auth";
import { registerPunchAtLocation,PunchError } from "@/lib/punch-service";
import { closeDuePunches } from "@/lib/auto-checkout";
import { getPunchWhatsAppRecipients } from "@/lib/whatsapp";
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
    const date=new Intl.DateTimeFormat("es-AR",{dateStyle:"short",timeZone:"America/Argentina/Buenos_Aires"}).format(result.punch.inAt);
    const time=new Intl.DateTimeFormat("es-AR",{timeStyle:"short",timeZone:"America/Argentina/Buenos_Aires"}).format(result.punch.inAt);
    const message=`Rodrigo registró su entrada el ${date} a las ${time}.`;
    const whatsappRecipients=getPunchWhatsAppRecipients(message);
    return NextResponse.json({ok:true,...result,whatsappRecipients},{status:201});
  } catch(cause) {
    if(cause instanceof PunchError)return error(cause.message,cause.status);
    const detail=cause&&typeof cause==="object"?cause as {name?:unknown;message?:unknown;code?:unknown}:{};
    console.error("Punch registration failed",{userId:user.id,action:b.action,name:detail.name,code:detail.code,message:detail.message});
    const code=typeof detail.code==="string"?` Código: ${detail.code}.`:"";
    return error(`No se pudo registrar la entrada por un error del servidor.${code} Avisá a administración.`,500);
  }
}
