import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';

function useSalesSeries(period) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ series: [], loading: true, error: '', requestKey: '' });
  const requestKey = `${period}:${attempt}`;

  useEffect(() => {
    let active = true;
    adminApi.getSalesSeries(period)
      .then((series) => {
        if (active) setState({ series, loading: false, error: '', requestKey });
      })
      .catch((error) => {
        if (active) setState((current) => ({ ...current, loading: false, error: error.message || 'Sales data could not be loaded.', requestKey }));
      });

    return () => { active = false; };
  }, [period, attempt, requestKey]);

  return {
    ...state,
    loading: state.loading || state.requestKey !== requestKey,
    error: state.requestKey === requestKey ? state.error : '',
    retry: () => setAttempt((value) => value + 1)
  };
}

export default useSalesSeries;
