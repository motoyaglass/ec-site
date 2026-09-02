import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type CountRow = { count: string };
type DailyRow = { day: string; count: string };
type HourRow = { hour: string; count: string };
type PathRow = { path: string; count: string };
type SourceRow = { source: string; count: string };
type DeviceRow = { device: string; count: string };

// 管理画面用のアクセス状況集計。middleware側で管理者ログインを必須にしています。
export async function GET() {
  try {
    const [
      [todayRow],
      [last7Row],
      [last30Row],
      [totalRow],
      daily,
      hourly,
      topPaths,
      sources,
      devices,
    ] = await Promise.all([
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
      // 時間帯別(日本時間)アクセス数。直近30日分。
      query<HourRow>(
        `select to_char(created_at at time zone 'Asia/Tokyo', 'HH24') as hour, count(*)::text as count
         from page_views
         where created_at >= now() - interval '30 days'
         group by 1
         order by 1 asc`
      ),
      // よく見られているページ。直近30日分の上位5件。
      query<PathRow>(
        `select path, count(*)::text as count
         from page_views
         where created_at >= now() - interval '30 days'
         group by 1
         order by count(*) desc
         limit 5`
      ),
      // 流入元(検索/SNS/direct/その他)。直近30日分。
      query<SourceRow>(
        `select
           case
             when referrer is null or referrer = '' then '直接・ブックマーク'
             when referrer ilike '%google.%' or referrer ilike '%bing.%' or referrer ilike '%yahoo.%' then '検索エンジン'
             when referrer ilike '%instagram.%' or referrer ilike '%twitter.%' or referrer ilike '%x.com%'
               or referrer ilike '%facebook.%' or referrer ilike '%line.me%' or referrer ilike '%pinterest.%' then 'SNS'
             else 'その他サイト'
           end as source,
           count(*)::text as count
         from page_views
         where created_at >= now() - interval '30 days'
         group by 1
         order by count(*) desc`
      ),
      // デバイス種別。直近30日分。
      query<DeviceRow>(
        `select coalesce(device, '不明') as device, count(*)::text as count
         from page_views
         where created_at >= now() - interval '30 days'
         group by 1
         order by count(*) desc`
      ),
    ]);

    const hourMap = new Map(hourly.map((h) => [h.hour, Number(h.count)]));
    const hourlyFilled = Array.from({ length: 24 }, (_, i) => {
      const hour = String(i).padStart(2, "0");
      return { hour, count: hourMap.get(hour) ?? 0 };
    });

    return NextResponse.json({
      today: Number(todayRow?.count ?? 0),
      last7: Number(last7Row?.count ?? 0),
      last30: Number(last30Row?.count ?? 0),
      total: Number(totalRow?.count ?? 0),
      daily: daily.map((d) => ({ day: d.day, count: Number(d.count) })),
      hourly: hourlyFilled,
      topPaths: topPaths.map((p) => ({ path: p.path, count: Number(p.count) })),
      sources: sources.map((s) => ({ source: s.source, count: Number(s.count) })),
      devices: devices.map((d) => ({ device: d.device, count: Number(d.count) })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to load stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
