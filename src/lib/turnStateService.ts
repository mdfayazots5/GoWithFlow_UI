import { BehaviorSubject, Observable } from 'rxjs';
import { websocketService } from './websocketService';
import { TurnState } from '@/types';

export interface ExtendedTurnState extends TurnState {
  status: 'LOBBY' | 'ACTIVE' | 'COMPLETED';
}

const initialTurnState: ExtendedTurnState = {
  sessionId: '',
  activeMemberId: '',
  activeSlotIndex: -1,
  turnIndex: -1,
  totalTurns: 0,
  utterance: {
    sequenceId: 0,
    speakerLabel: '',
    englishText: 'Waiting for session to start...',
    hintText: '',
    grammarTag: ''
  },
  reReadAllowed: true,
  reReadCount: 0,
  maxReReads: 3,
  status: 'LOBBY'
};

class TurnStateService {
  private stateSubject = new BehaviorSubject<ExtendedTurnState>(initialTurnState);

  constructor() {
    this.initListeners();
  }

  get state$(): Observable<ExtendedTurnState> {
    return this.stateSubject.asObservable();
  }

  get currentState(): ExtendedTurnState {
    return this.stateSubject.getValue();
  }

  private initListeners() {
    websocketService.on<any>('SESSION_STARTED').subscribe(data => {
      this.updateState({ 
        sessionId: data.sessionId,
        status: 'ACTIVE',
        activeMemberId: data.firstSpeakerId
      });
    });

    websocketService.on<any>('TURN_SHIFT').subscribe(data => {
      this.updateState({
        activeMemberId: data.newActiveMemberId,
        activeSlotIndex: data.slotIndex,
        turnIndex: data.turnIndex,
        utterance: data.nextUtterance,
        status: 'ACTIVE'
      });
    });

    websocketService.on<any>('SESSION_ENDED').subscribe(() => {
      this.updateState({ status: 'COMPLETED' });
    });
  }

  private updateState(patch: Partial<ExtendedTurnState>) {
    this.stateSubject.next({ ...this.stateSubject.getValue(), ...patch });
  }

  reset() {
    this.stateSubject.next(initialTurnState);
  }
}

export const turnStateService = new TurnStateService();
