"use client";
import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function InstallButton() {
  const [prompt,setPrompt]=useState<InstallPrompt|null>(null);
  const [open,setOpen]=useState(false);
  const [ios,setIos]=useState(false);
  const [installed,setInstalled]=useState(false);

  useEffect(()=>{
    const ua=navigator.userAgent;
    setIos(/iPhone|iPad|iPod/i.test(ua)&&!("standalone" in navigator&&Boolean((navigator as Navigator&{standalone?:boolean}).standalone)));
    if(window.matchMedia("(display-mode: standalone)").matches){setInstalled(true);return;}
    const capture=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPrompt);};
    const done=()=>{setInstalled(true);setPrompt(null);setOpen(false);};
    window.addEventListener("beforeinstallprompt",capture);
    window.addEventListener("appinstalled",done);
    return()=>{window.removeEventListener("beforeinstallprompt",capture);window.removeEventListener("appinstalled",done);};
  },[]);

  const install=async()=>{
    if(!prompt){setOpen(true);return;}
    await prompt.prompt();
    const choice=await prompt.userChoice;
    if(choice.outcome==="accepted")setInstalled(true);
    setPrompt(null);
  };

  if(installed)return null;
  return <>
    <button className="install-button" onClick={install}><span aria-hidden="true">↓</span>{prompt?"Instalar app":"Agregar al celular"}</button>
    {open&&<div className="install-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false);}}><section className="install-dialog" role="dialog" aria-modal="true" aria-labelledby="install-title"><button className="install-close" aria-label="Cerrar" onClick={()=>setOpen(false)}>×</button><span className="install-app-icon"><img src="/icon-192.png" alt=""/></span><p className="eyebrow">DIOSAS GRIEGAS</p><h2 id="install-title">Llevá la app al inicio</h2><p>Se agrega un acceso directo con su propio ícono. La web seguirá necesitando conexión a internet.</p>{ios?<ol><li>Abrí esta página en <b>Safari</b>.</li><li>Tocá <b>Compartir</b> <span aria-label="Compartir">□↑</span>.</li><li>Elegí <b>Agregar a pantalla de inicio</b> y confirmá.</li></ol>:<ol><li>En Chrome, abrí el menú <b>⋮</b>.</li><li>Tocá <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.</li><li>Confirmá la instalación.</li></ol>}<button className="button button-primary full" onClick={()=>setOpen(false)}>Entendido</button></section></div>}
  </>;
}
