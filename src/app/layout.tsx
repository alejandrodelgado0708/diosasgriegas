import type { Metadata,Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"Diosas Griegas | Asistencia y pagos", description:"Control de fichajes y pagos del equipo Diosas Griegas.", applicationName:"Diosas Griegas", manifest:"/manifest.webmanifest", appleWebApp:{capable:true,title:"Diosas Griegas",statusBarStyle:"default"}, icons:{icon:[{url:"/icon-192.png",sizes:"192x192",type:"image/png"},{url:"/icon-512.png",sizes:"512x512",type:"image/png"}],apple:"/icon-192.png"} };
export const viewport: Viewport = { themeColor:"#344f40", width:"device-width", initialScale:1 };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="es"><body>{children}</body></html>; }
