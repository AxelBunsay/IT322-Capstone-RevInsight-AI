import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';

function useDashboardData() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ data: null, loading: true, error: '', requestAttempt: -1 });

  useEffect(() => {
    let active = true;
    adminApi.getDashboardData()
      .then((data) => {
        if (active) setState({ data, loading: false, error: '', requestAttempt: attempt });
      })
      .catch((error) => {
        if (active) setState((current) => ({ ...current, loading: false, error: error.message || 'Dashboard data could not be loaded.', requestAttempt: attempt }));
      });

    return () => { active = false; };
  }, [attempt]);

  return {
    ...state,
    loading: state.loading || state.requestAttempt !== attempt,
    error: state.requestAttempt === attempt ? state.error : '',
    retry: () => setAttempt((value) => value + 1)
  };
}

export default useDashboardData;
