import { currentUser } from "@/lib/auth";
import { registerPunchAtLocation,PunchError } from "@/lib/punch-service";
import { error } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";

// The test flow records a real entry using the same location and duplicate checks as production.
export async function POST(req:NextRequest) {
  const user=await currentUser();
  if(!user)return error("Iniciá sesión.",401);
  if(user.role!=="vendedor")return error("Solo los vendedores pueden fichar.",403);
  const b=await req.json().catch(()=>null);
  try {
    const result=await registerPunchAtLocation(user.id,"in",b?.lat,b?.lng);
    return NextResponse.json({ok:true,...result},{status:201});
  } catch(e) {
    if(e instanceof PunchError)return error(e.message,e.status);
    throw e;
  }
}
