export type ServiceKpi = {
  service: string;
  serviceName: string;
  paletteId: string;
  kpi: Record<string, unknown>;
  health: 'green' | 'yellow' | 'red';
  lastActivity: string | null;
  port: number;
};

const SERVICE_PORTS: Record<string, { port: number; name: string }> = {
  pal_studio: { port: 3000, name: 'Pal Studio' },
  pal_base: { port: 3105, name: 'Pal Base' },
  pal_video: { port: 3103, name: 'Pal Video' },
  pal_opt: { port: 3104, name: 'Pal Opt' },
  pal_ad: { port: 3105, name: 'Pal Ad' },
  pal_trust: { port: 3000, name: 'Pal Trust' },
};

const fetchKpi = async (serviceKey: string, paletteId: string): Promise<ServiceKpi | null> => {
  const info = SERVICE_PORTS[serviceKey];
  if (!info) return null;
  try {
    const res = await fetch(`http://localhost:${info.port}/api/kpi?cid=${paletteId}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const fetchAllKpis = async (paletteId: string, subscribedServices: string[]): Promise<ServiceKpi[]> => {
  const results = await Promise.allSettled(
    subscribedServices
      .filter((s) => SERVICE_PORTS[s])
      .map((s) => fetchKpi(s, paletteId)),
  );
  return results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter((v): v is ServiceKpi => v !== null);
};

export { SERVICE_PORTS };
