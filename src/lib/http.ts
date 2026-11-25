import { NextResponse } from "next/server";
export function error(message:string,status=400) { return NextResponse.json({error:message},{status}); }
export function isDatabaseUnavailable(cause:unknown) {
  if(!cause||typeof cause!=="object")return false;
  const code="code" in cause?(cause as {code?:unknown}).code:undefined;
  return typeof code==="string"&&["P1001","P1002","P1008","P1017","P2024"].includes(code);
}
export function isDatabaseCredentialsInvalid(cause:unknown) {
  if(!cause||typeof cause!=="object")return false;
  return "code" in cause&&(cause as {code?:unknown}).code==="P1000";
}
export function isDatabaseSchemaOutOfDate(cause:unknown) {
  if(!cause||typeof cause!=="object")return false;
  const code="code" in cause?(cause as {code?:unknown}).code:undefined;
  return code==="P2021"||code==="P2022";
}
export function distanceMeters(a:number,b:number,c:number,d:number) { const rad=(n:number)=>n*Math.PI/180, da=rad(c-a), db=rad(d-b), h=Math.sin(da/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(db/2)**2; return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h)); }
export function isAdmin(user:{role:string}) { return user.role === "administrador"; }
