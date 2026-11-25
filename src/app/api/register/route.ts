import crypto from "node:crypto";
import { db } from "@/lib/db";
import { makeSession,passwordHash,sessionCookie,publicUser } from "@/lib/auth";
import { error } from "@/lib/http";
import { NextRequest,NextResponse } from "next/server";

export async function POST(req:NextRequest) {
  if(!process.env.DATABASE_URL)return error("Falta configurar DATABASE_URL en el servidor.",503);
  if(!process.env.SESSION_SECRET)return error("Falta configurar SESSION_SECRET en el servidor.",503);
  const body=await req.json().catch(()=>null);
  const firstName=String(body?.firstName||"").trim().replace(/\s+/g," ");
  const lastName=String(body?.lastName||"").trim().replace(/\s+/g," ");
  const phone=String(body?.phone||"").trim();
  const localAddress=String(body?.localAddress||"").trim().replace(/\s+/g," ");
  const role=body?.role;
  const password=String(body?.password||"");
  if(password.length<8)return error("La contraseña debe tener al menos 8 caracteres.");
  if(role!=="administrador"&&role!=="vendedor"&&role!=="local")return error("Elegí Administrador, Vendedor o Local.");
  if(role!=="local"&&(firstName.length<2||firstName.length>80||lastName.length<2||lastName.length>100))return error("Ingres\u00e1 nombre y apellido completos.");
  if(role!=="local"&&!/^\+?[0-9\s().-]{8,24}$/.test(phone))return error("Ingres\u00e1 un tel\u00e9fono v\u00e1lido con c\u00f3digo de \u00e1rea.");
  if(role==="local"&&(localAddress.length<5||localAddress.length>240))return error("Ingresá la dirección del local.");

  let username=String(body?.username||"").trim().toLowerCase();
  let email:string|null=null;
  if(role==="administrador") {
    email=String(body?.email||"").trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return error("Ingresá un correo electrónico válido.");
    const expected=process.env.ADMIN_REGISTRATION_CODE;
    if(!expected)return error("El registro de administradores no está habilitado en el servidor.",503);
    const provided=Buffer.from(String(body?.adminCode||""));
    const expectedBuffer=Buffer.from(expected);
    if(provided.length!==expectedBuffer.length||!crypto.timingSafeEqual(provided,expectedBuffer))return error("La clave de autorización de administrador es incorrecta.",403);
    username=email;
  } else if(!/^[a-z0-9._-]{3,40}$/.test(username)) {
    return error("El usuario debe tener entre 3 y 40 letras, números, puntos, guiones o guiones bajos.");
  }

  const fullName=role==="local"?localAddress:firstName+" "+lastName;
  try {
    const user=await db.user.create({data:{name:fullName,firstName:role==="local"?null:firstName,lastName:role==="local"?null:lastName,phone:role==="local"?null:phone,email,username,passwordHash:passwordHash(password),role,...(role==="local"?{localAddress}:{})}});
    const res=NextResponse.json({user:publicUser(user)},{status:201});
    res.cookies.set(sessionCookie(makeSession(user.id)));
    return res;
  } catch(e:any) {
    if(e?.code==="P2002")return error(role==="administrador"?"Ese correo ya está registrado.":"Ese nombre de usuario ya está registrado.",409);
    throw e;
  }
}
