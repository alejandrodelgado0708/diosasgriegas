import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { error,isAdmin } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
 const admin=await currentUser();if(!admin)return error("Inicia sesion.",401);if(!isAdmin(admin))return error("Sin permiso.",403);
 const b=await req.json().catch(()=>null);const rate=Number(b?.hourlyRate),salary=Number(b?.weeklySalary),goal=Number(b?.weeklySalesGoal),reward=Number(b?.weeklyGoalReward);
 const scheduleProvided=Object.prototype.hasOwnProperty.call(b||{},"scheduledExitTime");
 const scheduledExitTime=scheduleProvided?(String(b.scheduledExitTime||"").trim()||null):undefined;
 if(![rate,salary,reward].every(Number.isFinite)||rate<0||salary<0||reward<0||!Number.isInteger(goal)||goal<0)return error("Revisa tarifa, sueldo, meta y recompensa.");
 if(scheduledExitTime!==undefined&&scheduledExitTime!==null&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(scheduledExitTime))return error("Elegi una hora de salida valida.");
 const {id}=await params;const result=await db.user.updateMany({where:{id,role:"vendedor"},data:{hourlyRate:rate,weeklySalary:salary,weeklySalesGoal:goal,weeklyGoalReward:reward,...(scheduleProvided?{scheduledExitTime}: {})}});
 return result.count?NextResponse.json({ok:true}):error("Vendedor no encontrado.",404);
}
