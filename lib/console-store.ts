import { sql } from '@vercel/postgres';

let initialized = false;

export const ensureConsoleTables = async () => {
  if (initialized) return;

  await sql`
    CREATE TABLE IF NOT EXISTS console_line_settings (
      id SERIAL PRIMARY KEY,
      palette_id VARCHAR(10) NOT NULL UNIQUE,
      line_user_id VARCHAR(64),
      notify_enabled BOOLEAN DEFAULT true,
      notify_frequency VARCHAR(20) DEFAULT 'realtime',
      notify_rules JSONB DEFAULT '{"pal_opt_inactive": true, "pal_trust_low_score": true, "pal_ad_budget_alert": true, "pal_video_complete": true, "pal_ad_campaign_end": true, "pal_studio_update": true, "pal_base_activity": true}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS console_tracking_events (
      id SERIAL PRIMARY KEY,
      palette_id VARCHAR(10) NOT NULL,
      page_path VARCHAR(500) NOT NULL,
      event_type VARCHAR(50) DEFAULT 'pageview',
      referrer VARCHAR(1000),
      user_agent VARCHAR(500),
      device_type VARCHAR(20),
      session_id VARCHAR(64),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_tracking_palette_id ON console_tracking_events(palette_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_tracking_created_at ON console_tracking_events(created_at)
  `;

  initialized = true;
};

// ── LINE Settings CRUD ──

export type LineSettingRecord = {
  id: number;
  paletteId: string;
  lineUserId: string | null;
  notifyEnabled: boolean;
  notifyFrequency: string;
  notifyRules: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
};

type Row = Record<string, unknown>;

const toLineSetting = (row: Row): LineSettingRecord => ({
  id: Number(row.id),
  paletteId: String(row.palette_id || ''),
  lineUserId: row.line_user_id ? String(row.line_user_id) : null,
  notifyEnabled: Boolean(row.notify_enabled),
  notifyFrequency: String(row.notify_frequency || 'realtime'),
  notifyRules: (typeof row.notify_rules === 'object' && row.notify_rules !== null
    ? row.notify_rules
    : {}) as Record<string, boolean>,
  createdAt: String(row.created_at || ''),
  updatedAt: String(row.updated_at || ''),
});

export const getAllLineSettings = async (): Promise<LineSettingRecord[]> => {
  await ensureConsoleTables();
  const result = await sql`SELECT * FROM console_line_settings ORDER BY palette_id`;
  return result.rows.map((r) => toLineSetting(r as Row));
};

export const getLineSettingByPaletteId = async (paletteId: string): Promise<LineSettingRecord | null> => {
  await ensureConsoleTables();
  const result = await sql`SELECT * FROM console_line_settings WHERE palette_id = ${paletteId}`;
  if (result.rows.length === 0) return null;
  return toLineSetting(result.rows[0] as Row);
};

export const upsertLineSetting = async (data: {
  paletteId: string;
  lineUserId?: string | null;
  notifyEnabled?: boolean;
  notifyFrequency?: string;
  notifyRules?: Record<string, boolean>;
}): Promise<LineSettingRecord> => {
  await ensureConsoleTables();
  const existing = await getLineSettingByPaletteId(data.paletteId);

  if (existing) {
    const lineUserId = data.lineUserId !== undefined ? data.lineUserId : existing.lineUserId;
    const notifyEnabled = data.notifyEnabled !== undefined ? data.notifyEnabled : existing.notifyEnabled;
    const notifyFrequency = data.notifyFrequency || existing.notifyFrequency;
    const notifyRules = data.notifyRules || existing.notifyRules;

    await sql`
      UPDATE console_line_settings
      SET line_user_id = ${lineUserId},
          notify_enabled = ${notifyEnabled},
          notify_frequency = ${notifyFrequency},
          notify_rules = ${JSON.stringify(notifyRules)},
          updated_at = NOW()
      WHERE palette_id = ${data.paletteId}
    `;
  } else {
    const lineUserId = data.lineUserId || null;
    const notifyEnabled = data.notifyEnabled !== undefined ? data.notifyEnabled : true;
    const notifyFrequency = data.notifyFrequency || 'realtime';
    const notifyRules = JSON.stringify(data.notifyRules || {
      pal_opt_inactive: true,
      pal_trust_low_score: true,
      pal_ad_budget_alert: true,
      pal_video_complete: true,
      pal_ad_campaign_end: true,
      pal_studio_update: true,
      pal_base_activity: true,
    });

    await sql`
      INSERT INTO console_line_settings (palette_id, line_user_id, notify_enabled, notify_frequency, notify_rules)
      VALUES (${data.paletteId}, ${lineUserId}, ${notifyEnabled}, ${notifyFrequency}, ${notifyRules})
    `;
  }

  return (await getLineSettingByPaletteId(data.paletteId))!;
};

export const deleteLineSetting = async (paletteId: string): Promise<void> => {
  await ensureConsoleTables();
  await sql`DELETE FROM console_line_settings WHERE palette_id = ${paletteId}`;
};

// ── Tracking Events ──

export type TrackingEvent = {
  id: number;
  paletteId: string;
  pagePath: string;
  eventType: string;
  referrer: string | null;
  userAgent: string | null;
  deviceType: string | null;
  sessionId: string | null;
  createdAt: string;
};

export const insertTrackingEvent = async (data: {
  paletteId: string;
  pagePath: string;
  eventType?: string;
  referrer?: string;
  userAgent?: string;
  deviceType?: string;
  sessionId?: string;
}): Promise<void> => {
  await ensureConsoleTables();
  await sql`
    INSERT INTO console_tracking_events (palette_id, page_path, event_type, referrer, user_agent, device_type, session_id)
    VALUES (${data.paletteId}, ${data.pagePath}, ${data.eventType || 'pageview'}, ${data.referrer || null}, ${data.userAgent || null}, ${data.deviceType || null}, ${data.sessionId || null})
  `;
};

export const getTrackingStats = async (paletteId: string, days: number = 30) => {
  await ensureConsoleTables();

  const totalPv = await sql`
    SELECT COUNT(*) as count FROM console_tracking_events
    WHERE palette_id = ${paletteId} AND created_at > NOW() - INTERVAL '1 day' * ${days}
  `;

  const uniqueVisitors = await sql`
    SELECT COUNT(DISTINCT session_id) as count FROM console_tracking_events
    WHERE palette_id = ${paletteId} AND created_at > NOW() - INTERVAL '1 day' * ${days} AND session_id IS NOT NULL
  `;

  const dailyPv = await sql`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM console_tracking_events
    WHERE palette_id = ${paletteId} AND created_at > NOW() - INTERVAL '1 day' * ${days}
    GROUP BY DATE(created_at)
    ORDER BY date
  `;

  const topPages = await sql`
    SELECT page_path, COUNT(*) as count
    FROM console_tracking_events
    WHERE palette_id = ${paletteId} AND created_at > NOW() - INTERVAL '1 day' * ${days}
    GROUP BY page_path
    ORDER BY count DESC
    LIMIT 10
  `;

  const deviceBreakdown = await sql`
    SELECT device_type, COUNT(*) as count
    FROM console_tracking_events
    WHERE palette_id = ${paletteId} AND created_at > NOW() - INTERVAL '1 day' * ${days} AND device_type IS NOT NULL
    GROUP BY device_type
  `;

  const referrers = await sql`
    SELECT referrer, COUNT(*) as count
    FROM console_tracking_events
    WHERE palette_id = ${paletteId} AND created_at > NOW() - INTERVAL '1 day' * ${days} AND referrer IS NOT NULL AND referrer != ''
    GROUP BY referrer
    ORDER BY count DESC
    LIMIT 10
  `;

  return {
    totalPageViews: Number((totalPv.rows[0] as Row)?.count || 0),
    uniqueVisitors: Number((uniqueVisitors.rows[0] as Row)?.count || 0),
    dailyPageViews: dailyPv.rows.map((r) => ({ date: String((r as Row).date), count: Number((r as Row).count) })),
    topPages: topPages.rows.map((r) => ({ path: String((r as Row).page_path), count: Number((r as Row).count) })),
    deviceBreakdown: deviceBreakdown.rows.map((r) => ({ device: String((r as Row).device_type), count: Number((r as Row).count) })),
    topReferrers: referrers.rows.map((r) => ({ referrer: String((r as Row).referrer), count: Number((r as Row).count) })),
  };
};
