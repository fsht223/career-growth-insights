import { useState, useCallback } from 'react';
import { useToast } from './useToast';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showError } = useToast();

  const request = useCallback(
    async (apiCall) => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiCall();
        return data;
      } catch (err) {
        setError(err);
        showError(err.error || err.message || 'Произошла ошибка');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [showError]
  );

  return { loading, error, request };
};
