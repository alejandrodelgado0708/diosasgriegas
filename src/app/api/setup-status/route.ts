import { db } from "@/lib/db";
import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({needed:!(await db.user.count({where:{role:"administrador"}}))}); }
