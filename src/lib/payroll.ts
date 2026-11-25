import { db } from "@/lib/db";

const tz = "America/Argentina/Buenos_Aires";
export function localDate(date: Date) { return new Intl.DateTimeFormat("en-CA", { timeZone:tz, year:"numeric", month:"2-digit", day:"2-digit" }).format(date); }
export function weekBounds(startInput?: string) {
  const today=localDate(new Date());
  const source=startInput || today;
  const monday=new Date(`${source}T12:00:00Z`);const day=(monday.getUTCDay()+6)%7;monday.setUTCDate(monday.getUTCDate()-day);
  const start=monday.toISOString().slice(0,10);
  const endDate=new Date(`${start}T12:00:00Z`);endDate.setUTCDate(endDate.getUTCDate()+7);
  return { start, end:endDate.toISOString().slice(0,10) };
}
export async function payroll(startInput?:string) {
  const {start,end}=weekBounds(startInput);
  const from=new Date(`${start}T03:00:00.000Z`), to=new Date(`${end}T03:00:00.000Z`);
  const employees=await db.user.findMany({where:{role:"vendedor",active:true},orderBy:{name:"asc"},include:{punches:{where:{inAt:{lt:to},OR:[{outAt:null},{outAt:{gt:from}}]}},sales:{where:{date:{gte:start,lt:end}}}}});
  return {start,end:new Date(new Date(`${end}T12:00:00Z`).getTime()-86400000).toISOString().slice(0,10),employees:employees.map(u=>{
    const hours=u.punches.reduce((sum,p)=>p.outAt?sum+Math.max(0,Math.min(p.outAt.getTime(),to.getTime())-Math.max(p.inAt.getTime(),from.getTime()))/3600000:sum,0);
    const pieces=u.sales.reduce((sum,s)=>sum+s.count,0), commission=u.sales.reduce((sum,s)=>sum+Math.max(0,s.count-14)*500,0), hourlyWages=Math.round(hours*Number(u.hourlyRate)), fixedSalary=Number(u.weeklySalary), goalReward=u.weeklySalesGoal>0&&pieces>=u.weeklySalesGoal?Number(u.weeklyGoalReward):0;
    return {id:u.id,name:u.name,hours:Number(hours.toFixed(2)),hourlyRate:Number(u.hourlyRate),hourlyWages,fixedSalary,pieces,commission,weeklySalesGoal:u.weeklySalesGoal,weeklyGoalReward:Number(u.weeklyGoalReward),goalReward,total:hourlyWages+fixedSalary+commission+goalReward};
  })};
}
