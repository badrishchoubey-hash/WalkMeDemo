import { useEffect, useState } from 'react';
import { workflows } from '../../../../packages/shared/workflows';
import {
  catalogKey,
  readCatalog,
} from '../../../../packages/shared/workflow-catalog';
export function useWorkflowCatalog() {
  const [catalog, setCatalog] = useState(workflows);
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false;
    const update = (value: unknown) => {
      try {
        const parsed = readCatalog(value);
        if (!disposed) {
          setCatalog(parsed);
          setError('');
        }
      } catch (failure) {
        if (!disposed) {
          setCatalog(workflows);
          setError(
            failure instanceof Error
              ? failure.message
              : 'Published workflow content is unavailable.',
          );
        }
      }
    };
    void chrome.storage.local
      .get(catalogKey)
      .then((value) => update(value[catalogKey]))
      .catch(() => {
        if (!disposed)
          setError('Published workflow content could not be loaded.');
      });
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === 'local' && changes[catalogKey])
        update(changes[catalogKey].newValue);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      disposed = true;
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);
  return { catalog, error };
}
