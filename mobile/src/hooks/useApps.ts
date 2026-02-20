import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApps, fetchApp } from '@/lib/api/apps';
import type { IPAApp, AppCategory } from '@/types/app';

const APPS_QUERY_KEY = ['apps'];

export function useApps(status?: string) {
  const query = useQuery({
    queryKey: [...APPS_QUERY_KEY, status],
    queryFn: () => fetchApps(status),
    staleTime: 60 * 1000,
  });

  const apps = (query.data ?? []) as IPAApp[];

  const derived = useMemo(() => {
    const getAppsByCategory = (category: AppCategory) =>
      apps.filter((app) => app.category === category);
    const getTopApps = () =>
      [...apps].sort((a, b) => b.downloads - a.downloads).slice(0, 6);
    const getLatestApps = () =>
      [...apps]
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        .slice(0, 6);
    const getAppById = (id: string) => apps.find((app) => app.id === id);
    const searchApps = (q: string) => {
      const lower = q.toLowerCase();
      return apps.filter(
        (app) =>
          app.name.toLowerCase().includes(lower) ||
          app.developerName.toLowerCase().includes(lower) ||
          app.description.toLowerCase().includes(lower)
      );
    };
    return {
      getAppsByCategory,
      getTopApps,
      getLatestApps,
      getAppById,
      searchApps,
    };
  }, [apps]);

  return {
    apps,
    ...derived,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useApp(id: string | undefined, deviceId?: string) {
  const query = useQuery({
    queryKey: ['app', id, deviceId],
    queryFn: () => (id ? fetchApp(id, deviceId) : Promise.resolve(null)),
    enabled: Boolean(id),
  });
  return {
    app: query.data ?? undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
