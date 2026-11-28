export type PunchNotificationResult={status:"sent"|"partial"|"failed"|"not_configured";sent:number;total:2};

export async function notifyPunchEntry(message:string):Promise<PunchNotificationResult> {
  const baseUrl=process.env.EVOLUTION_API_URL?.trim().replace(/\/+$/g,"");
  const apiKey=process.env.EVOLUTION_API_KEY?.trim();
  const instance=process.env.EVOLUTION_INSTANCE?.trim();
  const rawPhones=process.env.WHATSAPP_PUNCH_PHONES?.trim();
  if(!baseUrl||!apiKey||!instance||!rawPhones)return {status:"not_configured",sent:0,total:2};

  const phones=rawPhones.split(",").map(phone=>phone.replace(/\D/g,""));
  if(phones.length!==2||phones.some(phone=>phone.length<8||phone.length>15)||phones[0]===phones[1])return {status:"failed",sent:0,total:2};

  const endpoint=`${baseUrl}/message/sendText/${encodeURIComponent(instance)}`;
  const results=await Promise.all(phones.map(async number=>{
    try {
      const response=await fetch(endpoint,{
        method:"POST",
        headers:{"Content-Type":"application/json",apikey:apiKey},
        body:JSON.stringify({number,text:message}),
        signal:AbortSignal.timeout(10000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }));
  const sent=results.filter(Boolean).length;
  return {status:sent===2?"sent":sent===1?"partial":"failed",sent,total:2};
}