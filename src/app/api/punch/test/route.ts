import { currentUser } from "@/lib/auth";
import { registerPunchAtLocation,PunchError } from "@/lib/punch-service";
import { error } from "@/lib/http";
import { NextResponse } from "next/server";

// Test records an entry without asking for GPS; regular punches still enforce the geofence.
export async function POST() {
  const user=await currentUser();
  if(!user)return error("Inicia sesion.",401);
  if(user.role!=="vendedor")return error("Solo los vendedores pueden fichar.",403);
  try {
    const result=await registerPunchAtLocation(user.id,"in",undefined,undefined,false);
    return NextResponse.json({ok:true,...result},{status:201});
  } catch(e) {
    if(e instanceof PunchError)return error(e.message,e.status);
    throw e;
  }
}
