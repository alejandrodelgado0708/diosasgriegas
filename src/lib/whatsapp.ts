export function getPunchWhatsAppRecipient(message:string) {
  const phone=process.env.WHATSAPP_PUNCH_PHONES?.split(",")[0]?.replace(/\D/g,"");
  if(!phone||phone.length<8||phone.length>15)return null;
  return {label:"Avisar por WhatsApp",url:`https://wa.me/${phone}?text=${encodeURIComponent(message)}`};
}