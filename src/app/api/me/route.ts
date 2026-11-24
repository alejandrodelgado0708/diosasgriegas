import { currentUser,publicUser } from "@/lib/auth";
import { NextResponse } from "next/server";
export async function GET() { const user=await currentUser();return user?NextResponse.json({user:publicUser(user)}):NextResponse.json({user:null},{status:401}); }
