import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { error,isAdmin } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
 const admin=await currentUser();if(!admin)return error("Inicia sesion.",401);if(!isAdmin(admin))return error("Sin permiso.",403);
 const b=await req.json().catch(()=>null);if(!b||typeof b!=="object")return error("Revisá los datos.");
 const rate=Number(b.hourlyRate),salary=Number(b.weeklySalary),goal=Number(b.weeklySalesGoal),reward=Number(b.weeklyGoalReward);
 const ratesProvided=["hourlyRate","weeklySalary","weeklySalesGoal","weeklyGoalReward"].some(key=>Object.prototype.hasOwnProperty.call(b,key));
 const scheduleProvided=Object.prototype.hasOwnProperty.call(b||{},"scheduledExitTime");
 const scheduledExitTime=scheduleProvided?(String(b.scheduledExitTime||"").trim()||null):undefined;
 const startProvided=Object.prototype.hasOwnProperty.call(b,"scheduledStartTime");
 const scheduledStartTime=startProvided?(String(b.scheduledStartTime||"").trim()||null):undefined;
 if(!ratesProvided&&!scheduleProvided&&!startProvided)return error("No hay cambios para guardar.");
 if(ratesProvided&&(![rate,salary,reward].every(Number.isFinite)||rate<0||salary<0||reward<0||!Number.isInteger(goal)||goal<0))return error("Revisa tarifa, sueldo, meta y recompensa.");
 if(scheduledExitTime!==undefined&&scheduledExitTime!==null&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(scheduledExitTime))return error("Elegi una hora de salida valida.");
 if(scheduledStartTime!==undefined&&scheduledStartTime!==null&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(scheduledStartTime))return error("Elegí una hora de entrada válida.");
 const {id}=await params;const result=await db.user.updateMany({where:{id,role:"vendedor"},data:{...(ratesProvided?{hourlyRate:rate,weeklySalary:salary,weeklySalesGoal:goal,weeklyGoalReward:reward}:{}),...(scheduleProvided?{scheduledExitTime}:{}),...(startProvided?{scheduledStartTime}:{})}});
 return result.count?NextResponse.json({ok:true}):error("Vendedor no encontrado.",404);
}
export async function DELETE(_req:NextRequest,{params}:{params:Promise<{id:string}>}) {
 const admin=await currentUser();if(!admin)return error("Inicia sesion.",401);if(!isAdmin(admin))return error("Sin permiso.",403);
 const {id}=await params;
 const result=await db.user.updateMany({where:{id,role:{in:["vendedor","local"]},active:true},data:{active:false}});
 return result.count?NextResponse.json({ok:true}):error("Usuario no encontrado.",404);
}
