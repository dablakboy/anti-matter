/** 48 hours in milliseconds */
const REVIEW_PERIOD_MS = 48 * 60 * 60 * 1000;

export interface AppWithReview {
  status?: string;
  lastUpdated?: string;
  createdAt?: string;
  created_at?: string;
}

export function canDownloadApp(app: AppWithReview): boolean {
  const status = app.status ?? 'pending';
  const created = app.createdAt ?? app.created_at ?? app.lastUpdated;
  if (!created) return status === 'approved';
  const createdAt = new Date(created).getTime();
  const elapsed = Date.now() - createdAt;
  if (status === 'approved') return true;
  return elapsed >= REVIEW_PERIOD_MS;
}

export function getDownloadCountdown(app: AppWithReview): {
  canDownload: boolean;
  remainingMs: number;
  label: string;
} {
  const status = app.status ?? 'pending';
  const created = app.createdAt ?? app.created_at ?? app.lastUpdated;
  const canDownload = canDownloadApp(app);

  if (canDownload) {
    return { canDownload: true, remainingMs: 0, label: '' };
  }

  if (!created) {
    return {
      canDownload: false,
      remainingMs: REVIEW_PERIOD_MS,
      label: 'Under review',
    };
  }

  const createdAt = new Date(created).getTime();
  const elapsed = Date.now() - createdAt;
  const remainingMs = Math.max(0, REVIEW_PERIOD_MS - elapsed);

  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  const label =
    hours > 0
      ? `Available in ${hours}h ${minutes}m`
      : minutes > 0
      ? `Available in ${minutes}m`
      : 'Under review';

  return {
    canDownload: false,
    remainingMs,
    label,
  };
}
