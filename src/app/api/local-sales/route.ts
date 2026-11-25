import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { error } from "@/lib/http";
import { localDate,weekBounds } from "@/lib/payroll";
import { NextRequest,NextResponse } from "next/server";

export async function GET(req:NextRequest) {
  const user=await currentUser();
  if(!user)return error("Iniciá sesión.",401);
  if(user.role!=="local"&&user.role!=="administrador")return error("Sin permiso.",403);
  const requestedId=req.nextUrl.searchParams.get("localUserId");
  const localUserId=user.role==="local"?user.id:requestedId||undefined;
  const local=localUserId?await db.user.findFirst({where:{id:localUserId,role:"local",active:true},select:{id:true,name:true,localAddress:true}}):null;
  if(localUserId&&!local)return error("Local no encontrado.",404);
  const requestedStart=req.nextUrl.searchParams.get("start")||undefined;
  if(requestedStart&&!/^\d{4}-\d{2}-\d{2}$/.test(requestedStart))return error("Fecha inválida.");
  const {start,end}=weekBounds(requestedStart);
  const from=new Date(`${start}T03:00:00.000Z`),to=new Date(`${end}T03:00:00.000Z`);
  const sales=await db.storeSale.findMany({where:{...(localUserId?{localUserId}:{}),soldAt:{gte:from,lt:to},...(user.role==="administrador"?{local:{is:{role:"local",active:true}}}:{})},include:{local:{select:{name:true,localAddress:true}}},orderBy:[{soldAt:"desc"},{saleNumber:"desc"}]});
  return NextResponse.json({local,start,end:new Date(to.getTime()-86400000).toISOString().slice(0,10),total:sales.reduce((sum,s)=>sum+Number(s.price),0),sales:sales.map(s=>({...s,price:Number(s.price)}))});
}

export async function POST(req:NextRequest) {
  const user=await currentUser();
  if(!user)return error("Iniciá sesión.",401);
  if(user.role!=="local")return error("Solo una cuenta de local puede cargar ventas.",403);
  const body=await req.json().catch(()=>null);
  const saleNumber=Number(body?.saleNumber),price=Number(body?.price),size=String(body?.size||"").trim(),paymentMethod=String(body?.paymentMethod||""),soldBy=String(body?.soldBy||"").trim().replace(/\s+/g," ");
  const methods=["Efectivo","Transferencia","Débito","Crédito","Otro"];
  if(!Number.isInteger(saleNumber)||saleNumber<1||saleNumber>100000||!Number.isFinite(price)||price<0||price>1000000000||size.length<1||size.length>40||!methods.includes(paymentMethod)||soldBy.length<2||soldBy.length>100)return error("Revisá número, precio, talle, medio de pago y vendedor.");
  const now=new Date(),saleDate=localDate(now);
  try {
    const sale=await db.storeSale.create({data:{localUserId:user.id,saleDate,saleNumber,price,size,paymentMethod,soldBy,soldAt:now}});
    return NextResponse.json({ok:true,sale:{...sale,price:Number(sale.price)}},{status:201});
  } catch(e:any) {
    if(e?.code==="P2002")return error("Ese número de venta ya se cargó hoy en este local.",409);
    throw e;
  }
}
