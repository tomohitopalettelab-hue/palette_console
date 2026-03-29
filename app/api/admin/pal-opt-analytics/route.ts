import { NextResponse } from 'next/server';
import { palDbGet } from '@/lib/pal-db-client';

/**
 * GET /api/admin/pal-opt-analytics?paletteId=xxx
 * pal_opt の投稿分析データを集計して返す
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const paletteId = url.searchParams.get('paletteId')?.trim() || '';

    // pal_db から pal_opt_posts を取得
    const params = new URLSearchParams();
    if (paletteId) params.set('paletteId', paletteId);
    params.set('limit', '500');

    const postsRes = await palDbGet(`/api/pal-opt-posts?${params.toString()}`);
    if (!postsRes.ok) {
      return NextResponse.json({ success: false, error: '投稿データの取得に失敗しました。' }, { status: 500 });
    }

    const postsBody = await postsRes.json().catch(() => ({}));
    const posts: Array<{
      id: string;
      status: string;
      published_platforms: string[];
      source: string;
      created_at: string;
      scheduled_at: string | null;
    }> = Array.isArray(postsBody?.posts) ? postsBody.posts : [];

    // 集計
    const totalPosts = posts.length;
    const publishedPosts = posts.filter((p) => p.status === 'published').length;
    const draftPosts = posts.filter((p) => p.status === 'draft' || p.status === 'preview').length;
    const scheduledPosts = posts.filter((p) => p.status === 'scheduled').length;
    const failedPosts = posts.filter((p) => p.status === 'failed').length;

    // プラットフォーム分布
    const platformDistribution: Record<string, number> = {};
    posts.forEach((p) => {
      const platforms = Array.isArray(p.published_platforms) ? p.published_platforms : [];
      platforms.forEach((platform: string) => {
        platformDistribution[platform] = (platformDistribution[platform] || 0) + 1;
      });
    });

    // ステータス分布
    const statusDistribution: Record<string, number> = {};
    posts.forEach((p) => {
      statusDistribution[p.status] = (statusDistribution[p.status] || 0) + 1;
    });

    // 投稿元サービス分布
    const sourceDistribution: Record<string, number> = {};
    posts.forEach((p) => {
      const source = p.source || 'pal_opt';
      sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
    });

    // 週別投稿数（過去8週）
    const weeklyPosts: { week: string; count: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7 + now.getDay()));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const count = posts.filter((p) => {
        const date = new Date(p.created_at);
        return date >= weekStart && date < weekEnd;
      }).length;

      const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      weeklyPosts.push({ week: label, count });
    }

    return NextResponse.json({
      success: true,
      analytics: {
        totalPosts,
        publishedPosts,
        draftPosts,
        scheduledPosts,
        failedPosts,
        platformDistribution,
        weeklyPosts,
        statusDistribution,
        sourceDistribution,
      },
    });
  } catch (error) {
    console.error('pal-opt-analytics error:', error);
    return NextResponse.json({ success: false, error: '分析データの取得に失敗しました。' }, { status: 500 });
  }
}
