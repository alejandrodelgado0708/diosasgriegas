import { closeDuePunches } from "@/lib/auto-checkout";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req:NextRequest) {
  const secret=process.env.CRON_SECRET;
  if(!secret)return NextResponse.json({error:"Falta configurar CRON_SECRET."},{status:503});
  if(req.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Sin permiso."},{status:401});
  return NextResponse.json({ok:true,closed:await closeDuePunches()});
}
