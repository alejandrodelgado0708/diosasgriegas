import { currentUser,publicUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { payroll,weekBounds,localDate } from "@/lib/payroll";
import { NextResponse } from "next/server";
export async function GET() {
  const user=await currentUser();if(!user)return NextResponse.json({error:"Iniciá sesión."},{status:401});
  const thisWeek=weekBounds(), today=localDate(new Date()), todayStart=new Date(`${today}T03:00:00.000Z`),tomorrow=new Date(todayStart.getTime()+86400000);
  const [punches,open,settings,employees,sales,currentReport,dueReport]=await Promise.all([
    db.punch.findMany({where:user.role==="administrador"?{}:{userId:user.id},include:{user:{select:{name:true}}},orderBy:{inAt:"desc"},take:100}),
    db.punch.findFirst({where:{userId:user.id,outAt:null},orderBy:{inAt:"desc"}}),
    user.role==="administrador"?db.shop.findMany({where:{active:true},orderBy:{id:"asc"}}):null,
    user.role==="administrador"?db.user.findMany({where:{role:"vendedor",active:true},orderBy:{name:"asc"}}):null,
    user.role==="administrador"?db.dailySale.findMany({where:{date:{gte:today.slice(0,7)+"-01",lte:today}},include:{user:{select:{name:true}}},orderBy:{date:"desc"}}):null,
    payroll(),
    payroll(thisWeek.start)
  ]);
  const ownToday=await db.punch.findMany({where:{userId:user.id,inAt:{gte:todayStart,lt:tomorrow}},orderBy:{inAt:"desc"}});
  const filterReport=(report:Awaited<ReturnType<typeof payroll>>)=>user.role==="administrador"?report:{...report,employees:report.employees.filter(e=>e.id===user.id)};
  return NextResponse.json({user:publicUser(user),shops:settings,employees:employees?.map(publicUser),punches:punches.map(p=>({...p,userName:p.user.name})),open,ownToday,sales:sales?.map(s=>({...s,userName:s.user.name})),currentReport:filterReport(currentReport),dueReport:filterReport(dueReport)});
}
