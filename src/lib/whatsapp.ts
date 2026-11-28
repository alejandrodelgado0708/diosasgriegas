export function getPunchWhatsAppRecipients(message:string) {
  const phones=[...new Set((process.env.WHATSAPP_PUNCH_PHONES||"").split(",").map(value=>value.replace(/\D/g,"")))]
    .filter(phone=>phone.length>=8&&phone.length<=15);
  return phones.map((phone,index)=>({label:`Avisar por WhatsApp ${index+1}`,url:`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}));
}