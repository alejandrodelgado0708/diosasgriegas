import { currentUser,publicUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { closeDuePunches } from "@/lib/auto-checkout";
import { payroll,weekBounds,localDate } from "@/lib/payroll";
import { isDatabaseSchemaOutOfDate,isDatabaseUnavailable } from "@/lib/http";
import { NextResponse } from "next/server";
export async function GET() {
 try {
  const user=await currentUser();if(!user)return NextResponse.json({error:"Iniciá sesión."},{status:401});
  if(user.role==="local") { const bounds=weekBounds();return NextResponse.json({user:publicUser(user),shops:null,employees:null,locals:null,punches:[],open:null,openPunches:[],ownToday:[],sales:null,currentReport:{...bounds,employees:[]},dueReport:{...bounds,employees:[]}}); }
  await closeDuePunches();
  const thisWeek=weekBounds(), today=localDate(new Date()), todayStart=new Date(`${today}T03:00:00.000Z`),tomorrow=new Date(todayStart.getTime()+86400000);
  const [punches,open,openPunches,settings,employees,sales,locals,currentReport,dueReport]=await Promise.all([
    db.punch.findMany({where:user.role==="administrador"?{}:{userId:user.id},include:{user:{select:{name:true}},shop:{select:{name:true}}},orderBy:{inAt:"desc"},take:100}),
    db.punch.findFirst({where:{userId:user.id,outAt:null},orderBy:{inAt:"desc"}}),
    db.punch.findMany({where:user.role==="administrador"?{outAt:null,user:{is:{role:"vendedor"}}}:{userId:user.id,outAt:null},include:{user:{select:{name:true,scheduledExitTime:true}},shop:{select:{name:true,scheduledExitTime:true}}},orderBy:{inAt:"asc"}}),
    user.role==="administrador"?db.shop.findMany({where:{active:true},orderBy:{id:"asc"}}):null,
    user.role==="administrador"?db.user.findMany({where:{role:"vendedor",active:true},orderBy:{name:"asc"}}):null,
    user.role==="administrador"?db.dailySale.findMany({where:{date:{gte:today.slice(0,7)+"-01",lte:today}},include:{user:{select:{name:true}}},orderBy:{date:"desc"}}):null,
    user.role==="administrador"?db.user.findMany({where:{role:"local",active:true},select:{id:true,name:true,localAddress:true},orderBy:{localAddress:"asc"}}):null,
    payroll(),
    payroll(thisWeek.start)
  ]);
  const ownToday=await db.punch.findMany({where:{userId:user.id,inAt:{gte:todayStart,lt:tomorrow}},orderBy:{inAt:"desc"}});
  const filterReport=(report:Awaited<ReturnType<typeof payroll>>)=>user.role==="administrador"?report:{...report,employees:report.employees.filter(e=>e.id===user.id)};
  return NextResponse.json({user:publicUser(user),shops:settings,employees:employees?.map(publicUser),locals,punches:punches.map(p=>({...p,userName:p.user.name,shopName:p.shop?.name||""})),open,openPunches:openPunches.map(p=>({...p,userName:p.user.name,scheduledExitTime:p.shop?.scheduledExitTime||p.user.scheduledExitTime,shopName:p.shop?.name||""})),ownToday,sales:sales?.map(s=>({...s,userName:s.user.name})),currentReport:filterReport(currentReport),dueReport:filterReport(dueReport)});
 } catch(cause) {
  if(isDatabaseUnavailable(cause))return NextResponse.json({error:"No hay conexión con la base de datos. Revisá que el servidor esté disponible e intentá de nuevo."},{status:503});
  if(isDatabaseSchemaOutOfDate(cause))return NextResponse.json({error:"La base de datos todavía no tiene las últimas actualizaciones. Cuando vuelva la conexión, ejecutá npm run db:deploy."},{status:503});
  throw cause;
 }
}
