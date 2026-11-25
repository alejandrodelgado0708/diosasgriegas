import { localDate } from "@/lib/payroll";

export type PunchPeriod = "week" | "fortnight" | "month";
function utcDate(value:string) { return new Date(`${value}T12:00:00.000Z`); }
function iso(date:Date) { return date.toISOString().slice(0,10); }
export function periodBounds(period:PunchPeriod, dateInput?:string) {
  const date=dateInput||localDate(new Date());
  const d=utcDate(date); let start:string,end:string;
  if(period==="week") { const offset=(d.getUTCDay()+6)%7; d.setUTCDate(d.getUTCDate()-offset);start=iso(d);d.setUTCDate(d.getUTCDate()+7);end=iso(d); }
  else if(period==="fortnight") { const y=d.getUTCFullYear(),m=d.getUTCMonth();if(d.getUTCDate()<=15){start=iso(new Date(Date.UTC(y,m,1,12)));end=iso(new Date(Date.UTC(y,m,16,12)));}else{start=iso(new Date(Date.UTC(y,m,16,12)));end=iso(new Date(Date.UTC(y,m+1,1,12)));} }
  else { const y=d.getUTCFullYear(),m=d.getUTCMonth();start=iso(new Date(Date.UTC(y,m,1,12)));end=iso(new Date(Date.UTC(y,m+1,1,12))); }
  return {start,end,endInclusive:iso(new Date(utcDate(end).getTime()-86400000))};
}
export function localMidnightUtc(date:string) { return new Date(`${date}T03:00:00.000Z`); }
