import { useState, useEffect } from 'react';
import { turnStateService, ExtendedTurnState } from '../turnStateService';

export function useTurnState() {
  const [state, setState] = useState<ExtendedTurnState>(turnStateService.currentState);

  useEffect(() => {
    const sub = turnStateService.state$.subscribe(newState => {
      setState(newState);
    });
    return () => sub.unsubscribe();
  }, []);

  return state;
}
