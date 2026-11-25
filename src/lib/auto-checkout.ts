import { db } from "@/lib/db";

const TIME_ZONE="America/Argentina/Buenos_Aires";

function localDate(date:Date) {
  return new Intl.DateTimeFormat("en-CA",{timeZone:TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
}

function scheduledUtc(date:string,time:string) {
  // Argentina/Buenos_Aires currently uses UTC-03:00.
  return new Date(`${date}T${time}:00-03:00`);
}

export async function closeDuePunches(now=new Date(),userId?:string) {
  const open=await db.punch.findMany({
    where:{outAt:null,...(userId?{userId}:{}),user:{is:{role:"vendedor",scheduledExitTime:{not:null}}}},
    include:{user:{select:{scheduledExitTime:true}}},
  });
  let closed=0;
  for(const punch of open) {
    const exitTime=punch.user.scheduledExitTime;
    if(!exitTime||!/^([01]\d|2[0-3]):[0-5]\d$/.test(exitTime))continue;
    const scheduled=scheduledUtc(localDate(punch.inAt),exitTime);
    if(scheduled>now)continue;
    const outAt=scheduled<punch.inAt?punch.inAt:scheduled;
    const result=await db.punch.updateMany({where:{id:punch.id,outAt:null},data:{outAt,autoClosed:true}});
    closed+=result.count;
  }
  return closed;
}
