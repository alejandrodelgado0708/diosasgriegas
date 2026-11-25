import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE = "control_session";
const secret = () => {
  const value = process.env.SESSION_SECRET;
  if (!value && process.env.NODE_ENV === "production") throw new Error("Falta configurar SESSION_SECRET.");
  return value || "dev-session-secret-cambiar-antes-de-publicar";
};
function signature(value: string) { return crypto.createHmac("sha256", secret()).update(value).digest("base64url"); }
export function makeSession(id: string) { const body = `${id}.${Date.now() + 1000 * 60 * 60 * 12}`; return `${body}.${signature(body)}`; }
export async function currentUser() {
  const jar = await cookies(); const raw = jar.get(COOKIE)?.value; if (!raw) return null;
  const parts = raw.split("."); if (parts.length !== 3) return null;
  const [id, expiry, sig] = parts; const body = `${id}.${expiry}`;
  const a = Buffer.from(sig), b = Buffer.from(signature(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b) || Number(expiry) < Date.now()) return null;
  return db.user.findFirst({ where: { id, active: true } });
}
export const sessionCookie = (value: string) => ({ name: COOKIE, value, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
export function passwordHash(password: string) { const salt = crypto.randomBytes(16).toString("hex"); return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`; }
export function validPassword(password: string) { return password.length >= 8 && /\p{Ll}/u.test(password) && /\p{Lu}/u.test(password); }
export function passwordMatches(password: string, stored: string) { const [salt, expectedHex] = stored.split(":"); if (!salt || !expectedHex) return false; const expected=Buffer.from(expectedHex,"hex"), actual=crypto.scryptSync(password,salt,64); return expected.length===actual.length&&crypto.timingSafeEqual(expected,actual); }
export function publicUser(u: {id:string;name:string;username:string;email?:string|null;role:string;hourlyRate:unknown;firstName?:string|null;lastName?:string|null;phone?:string|null;localAddress?:string|null;scheduledExitTime?:string|null;weeklySalary?:unknown;weeklySalesGoal?:number;weeklyGoalReward?:unknown}) { return { id:u.id, name:u.name, firstName:u.firstName||"", lastName:u.lastName||"", phone:u.phone||"", localAddress:u.localAddress||"", scheduledExitTime:u.scheduledExitTime||null, username:u.username, email:u.email||"", role:u.role, hourlyRate:Number(u.hourlyRate), weeklySalary:Number(u.weeklySalary||0), weeklySalesGoal:u.weeklySalesGoal||0, weeklyGoalReward:Number(u.weeklyGoalReward||0) }; }
