import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type CountRow = { count: string };
type DailyRow = { day: string; count: string };

// 管理画面用のアクセス状況集計。middleware側で管理者ログインを必須にしています。
export async function GET() {
  try {
    const [[todayRow], [last7Row], [last30Row], [totalRow], daily] = await Promise.all([
      query<CountRow>(
        "select count(*)::text as count from page_views where created_at >= date_trunc('day', now())"
      ),
      query<CountRow>(
        "select count(*)::text as count from page_views where created_at >= now() - interval '7 days'"
      ),
      query<CountRow>(
        "select count(*)::text as count from page_views where created_at >= now() - interval '30 days'"
      ),
      query<CountRow>("select count(*)::text as count from page_views"),
      query<DailyRow>(
        `select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, count(*)::text as count
         from page_views
         where created_at >= now() - interval '13 days'
         group by 1
         order by 1 asc`
      ),
    ]);

    return NextResponse.json({
      today: Number(todayRow?.count ?? 0),
      last7: Number(last7Row?.count ?? 0),
      last30: Number(last30Row?.count ?? 0),
      total: Number(totalRow?.count ?? 0),
      daily: daily.map((d) => ({ day: d.day, count: Number(d.count) })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to load stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
