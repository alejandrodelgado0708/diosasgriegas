import { currentUser,passwordHash,publicUser,validPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { error,isAdmin } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req:NextRequest) {
  const admin=await currentUser();if(!admin)return error("Iniciá sesión.",401);if(!isAdmin(admin))return error("Sin permiso.",403);
  const b=await req.json().catch(()=>null);const name=String(b?.name||"").trim(),username=String(b?.username||"").trim().toLowerCase(),password=String(b?.password||""),rate=Number(b?.hourlyRate),salary=Number(b?.weeklySalary||0),goal=Number(b?.weeklySalesGoal||0),reward=Number(b?.weeklyGoalReward||0),scheduledExitTime=String(b?.scheduledExitTime||"").trim()||null;
  if(!validPassword(password))return error("La contrase\u00f1a debe tener al menos 8 caracteres e incluir may\u00fascula y min\u00fascula.");
  if(!name||!username||![rate,salary,reward].every(Number.isFinite)||rate<0||salary<0||reward<0||!Number.isInteger(goal)||goal<0)return error("Revisá los datos, los montos no pueden ser negativos y la meta debe ser un número entero.");
  if(scheduledExitTime&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(scheduledExitTime))return error("Elegí una hora de salida válida.");
  try { const user=await db.user.create({data:{name,username,passwordHash:passwordHash(password),hourlyRate:rate,weeklySalary:salary,weeklySalesGoal:goal,weeklyGoalReward:reward,scheduledExitTime,role:"vendedor"}});return NextResponse.json({user:publicUser(user)},{status:201}); }catch{return error("Ese nombre de usuario ya está registrado.",409);}
}
