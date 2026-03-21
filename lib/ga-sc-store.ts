import { sql } from '@vercel/postgres';

let tableReady = false;

export const ensureGaScTable = async () => {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS console_ga_sc_settings (
      id SERIAL PRIMARY KEY,
      palette_id VARCHAR(10) NOT NULL UNIQUE,
      ga4_property_id VARCHAR(50),
      sc_site_url VARCHAR(500),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  tableReady = true;
};

export type GaScSetting = {
  id: number;
  paletteId: string;
  ga4PropertyId: string | null;
  scSiteUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Row = Record<string, unknown>;

const toSetting = (row: Row): GaScSetting => ({
  id: Number(row.id),
  paletteId: String(row.palette_id || ''),
  ga4PropertyId: row.ga4_property_id ? String(row.ga4_property_id) : null,
  scSiteUrl: row.sc_site_url ? String(row.sc_site_url) : null,
  notes: row.notes ? String(row.notes) : null,
  createdAt: String(row.created_at || ''),
  updatedAt: String(row.updated_at || ''),
});

export const getAllGaScSettings = async (): Promise<GaScSetting[]> => {
  await ensureGaScTable();
  const result = await sql`SELECT * FROM console_ga_sc_settings ORDER BY palette_id`;
  return result.rows.map((r) => toSetting(r as Row));
};

export const getGaScSettingByPaletteId = async (paletteId: string): Promise<GaScSetting | null> => {
  await ensureGaScTable();
  const result = await sql`SELECT * FROM console_ga_sc_settings WHERE palette_id = ${paletteId}`;
  if (result.rows.length === 0) return null;
  return toSetting(result.rows[0] as Row);
};

export const upsertGaScSetting = async (data: {
  paletteId: string;
  ga4PropertyId?: string | null;
  scSiteUrl?: string | null;
  notes?: string | null;
}): Promise<GaScSetting> => {
  await ensureGaScTable();
  const existing = await getGaScSettingByPaletteId(data.paletteId);

  if (existing) {
    const ga4 = data.ga4PropertyId !== undefined ? data.ga4PropertyId : existing.ga4PropertyId;
    const sc = data.scSiteUrl !== undefined ? data.scSiteUrl : existing.scSiteUrl;
    const notes = data.notes !== undefined ? data.notes : existing.notes;
    await sql`
      UPDATE console_ga_sc_settings
      SET ga4_property_id = ${ga4}, sc_site_url = ${sc}, notes = ${notes}, updated_at = NOW()
      WHERE palette_id = ${data.paletteId}
    `;
  } else {
    await sql`
      INSERT INTO console_ga_sc_settings (palette_id, ga4_property_id, sc_site_url, notes)
      VALUES (${data.paletteId}, ${data.ga4PropertyId || null}, ${data.scSiteUrl || null}, ${data.notes || null})
    `;
  }
  return (await getGaScSettingByPaletteId(data.paletteId))!;
};

export const deleteGaScSetting = async (paletteId: string): Promise<void> => {
  await ensureGaScTable();
  await sql`DELETE FROM console_ga_sc_settings WHERE palette_id = ${paletteId}`;
};
