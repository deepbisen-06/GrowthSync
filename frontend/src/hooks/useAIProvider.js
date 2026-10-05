import { useEffect, useState } from 'react';
import api from '../api/client';

export default function useAIProvider() {
  const [provider, setProvider] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    api.get('/api/chat/config', { signal: controller.signal })
      .then(({ data }) => setProvider(data))
      .catch(() => { if (!controller.signal.aborted) setProvider({ configured: false, label: 'AI', recipient: 'unavailable provider' }); });
    return () => controller.abort();
  }, []);
  return provider;
}
