import { currentUser } from "@/lib/auth";
import { error,isAdmin } from "@/lib/http";
import { payroll } from "@/lib/payroll";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req:NextRequest) {const user=await currentUser();if(!user)return error("Iniciá sesión.",401);if(!isAdmin(user))return error("Sin permiso.",403);const start=req.nextUrl.searchParams.get("start")||undefined;if(start&&!/^\d{4}-\d{2}-\d{2}$/.test(start))return error("Fecha inválida.");return NextResponse.json({report:await payroll(start)});}
