import { useEffect, useState } from 'react';
import { api } from './api';

// Fetches a storefront content list (tracks/beats/packs/plugins/courses) from
// the local API. `items` starts empty, so pages should render fine mid-load.
export function useContent(resource) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listContent(resource)
      .then(({ items: fetched }) => { if (!cancelled) setItems(fetched); })
      .catch((err) => console.warn(`[Content] Failed to load ${resource}:`, err.message))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [resource]);

  return { items, loading };
}
