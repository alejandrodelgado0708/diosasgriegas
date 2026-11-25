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
  const today=localDate(new Date());
  const saleFilter={...(localUserId?{localUserId}:{}),...(user.role==="administrador"?{local:{is:{role:"local" as const,active:true}}}:{})};
  const [sales,todaySales]=await Promise.all([
    db.storeSale.findMany({where:{...saleFilter,soldAt:{gte:from,lt:to}},include:{local:{select:{name:true,localAddress:true}}},orderBy:[{soldAt:"desc"},{saleNumber:"desc"}]}),
    db.storeSale.findMany({where:{...saleFilter,saleDate:today},include:{local:{select:{name:true,localAddress:true}}},orderBy:[{saleNumber:"desc"}]})
  ]);
  return NextResponse.json({local,start,end:new Date(to.getTime()-86400000).toISOString().slice(0,10),total:sales.reduce((sum,s)=>sum+Number(s.price),0),sales:sales.map(s=>({...s,price:Number(s.price)})),today,todaySales:todaySales.map(s=>({...s,price:Number(s.price)})),nextSaleNumber:localUserId?todaySales.reduce((max,s)=>Math.max(max,s.saleNumber),0)+1:null});
}

class SaleNeedsResponsible extends Error {}

export async function POST(req:NextRequest) {
  const user=await currentUser();
  if(!user)return error("Inicia sesion.",401);
  if(user.role!=="local")return error("Solo una cuenta de local puede cargar ventas.",403);
  const body=await req.json().catch(()=>null);
  const price=Number(body?.price),productDetail=String(body?.productDetail||"").trim(),size=String(body?.size||"").trim(),paymentMethod=String(body?.paymentMethod||""),soldBy=String(body?.soldBy||"").trim().replace(/\s+/g," ");
  const methods=["Efectivo","Transferencia","D\u00e9bito","Cr\u00e9dito","Otro"];
  if(!Number.isFinite(price)||price<0||price>1000000000||productDetail.length<2||productDetail.length>300||size.length<1||size.length>40||!methods.includes(paymentMethod)||soldBy.length>100||(soldBy.length>0&&soldBy.length<2))return error("Revisa detalle, precio, talle y medio de pago.");
  const now=new Date(),saleDate=localDate(now);
  for(let attempt=0;attempt<4;attempt++) {
    try {
      const sale=await db.$transaction(async tx=>{
        const latest=await tx.storeSale.aggregate({where:{localUserId:user.id,saleDate},_max:{saleNumber:true}});
        const saleNumber=(latest._max.saleNumber||0)+1;
        if(saleNumber>=15&&soldBy.length<2)throw new SaleNeedsResponsible();
        return tx.storeSale.create({data:{localUserId:user.id,saleDate,saleNumber,productDetail,price,size,paymentMethod,soldBy:saleNumber>=15?soldBy:null,soldAt:now}});
      },{isolationLevel:"Serializable"});
      return NextResponse.json({ok:true,sale:{...sale,price:Number(sale.price)}},{status:201});
    } catch(e:any) {
      if(e instanceof SaleNeedsResponsible)return error("Desde la venta 15 del dia, ingresa el nombre de quien cobra la comision.");
      if(e?.code==="P2034"||e?.code==="P2002") {
        if(attempt<3)continue;
        return error("No se pudo asignar el numero de venta. Intenta guardarla nuevamente.",409);
      }
      throw e;
    }
  }
  return error("No se pudo guardar la venta.",409);
}