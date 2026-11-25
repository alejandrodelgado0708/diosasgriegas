import { currentUser,passwordHash,publicUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { error,isAdmin } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req:NextRequest) {
  const admin=await currentUser();if(!admin)return error("Iniciá sesión.",401);if(!isAdmin(admin))return error("Sin permiso.",403);
  const b=await req.json().catch(()=>null);const name=String(b?.name||"").trim(),username=String(b?.username||"").trim().toLowerCase(),password=String(b?.password||""),rate=Number(b?.hourlyRate),salary=Number(b?.weeklySalary||0),goal=Number(b?.weeklySalesGoal||0),reward=Number(b?.weeklyGoalReward||0);
  if(!name||!username||password.length<8||![rate,salary,reward].every(Number.isFinite)||rate<0||salary<0||reward<0||!Number.isInteger(goal)||goal<0)return error("Revisá los datos, los montos no pueden ser negativos y la meta debe ser un número entero.");
  try { const user=await db.user.create({data:{name,username,passwordHash:passwordHash(password),hourlyRate:rate,weeklySalary:salary,weeklySalesGoal:goal,weeklyGoalReward:reward,role:"vendedor"}});return NextResponse.json({user:publicUser(user)},{status:201}); }catch{return error("Ese nombre de usuario ya está registrado.",409);}
}
