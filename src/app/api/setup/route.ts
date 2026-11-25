import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({error:"Usá el formulario de registro actualizado."},{status:410});
}
