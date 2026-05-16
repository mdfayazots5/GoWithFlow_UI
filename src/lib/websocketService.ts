import { Subject, Observable, interval, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { isDemo } from './demoService';

const WS_BASE = 'ws://localhost:8080/ws';

export interface WSEvent<T = any> {
  type: string;
  data: T;
}

class WebsocketService {
  private socket$: WebSocketSubject<any> | null = null;
  private messageSubject = new Subject<WSEvent>();
  private demoIntervalSubscription: Subscription | null = null;
  private currentTurn = 0;
  private currentUserId: string | null = null;
  private currentSessionId: string | null = null;

  connect(sessionId: string, userId: string, token?: string): void {
    this.currentUserId = userId;
    this.currentSessionId = sessionId;
    if (isDemo) {
      console.log(`[WS-DEMO] Simulating connection for session: ${sessionId}, user: ${userId}`);
      this.startDemoSimulation(sessionId);
      return;
    }

    this.socket$ = webSocket({
      url: `${WS_BASE}?sessionId=${sessionId}&userId=${userId}&token=${token}`,
      openObserver: {
        next: () => console.log('[WS] Connection opened')
      },
      closeObserver: {
        next: () => console.log('[WS] Connection closed')
      }
    });

    this.socket$.subscribe({
      next: (msg) => this.messageSubject.next(msg),
      error: (err) => console.error('[WS] Connection error:', err),
      complete: () => console.log('[WS] Connection completed')
    });

    // Send initial AUTH if needed (already in URL but good practice)
    this.emit('AUTH', { userId, token });
  }

  on<T>(eventType: string): Observable<T> {
    return this.messageSubject.asObservable().pipe(
      filter(msg => msg.type === eventType),
      map(msg => msg.data as T)
    );
  }

  emit(type: string, data: any): void {
    if (isDemo) {
      console.log(`[WS-DEMO] Emitting: ${type}`, data);
      
      if (type === 'TURN_COMPLETE') {
         // Auto-advance turn in demo
         setTimeout(() => {
           this.currentTurn++;
           this.simulateTurnShift(this.currentTurn);
         }, 1500);
      }
      return;
    }

    if (this.socket$) {
      this.socket$.next({ type, data });
    }
  }

  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
    if (this.demoIntervalSubscription) {
      this.demoIntervalSubscription.unsubscribe();
      this.demoIntervalSubscription = null;
    }
  }

  private startDemoSimulation(sessionId: string) {
    if (this.demoIntervalSubscription) return;

    console.log('[WS-DEMO] Starting TURN_SHIFT simulation');
    
    // Initial events
    setTimeout(() => {
      this.messageSubject.next({
        type: 'SESSION_STARTED',
        data: { sessionId, firstSpeakerId: 'U001' }
      });
      
      // Trigger first turn shift immediately
      this.currentTurn = 0;
      this.simulateTurnShift(this.currentTurn);
    }, 1000);

    this.demoIntervalSubscription = interval(15000).subscribe(() => {
      this.currentTurn++;
      this.simulateTurnShift(this.currentTurn);
    });
  }

  private simulateTurnShift(index: number) {
    let memberIds = ['U001', 'U002', 'U003', 'U004'];
    
    // For S005 demo, we prioritize Ravi, Priya, and the connected user
    if (this.currentSessionId === 'S005' && this.currentUserId) {
       memberIds = ['U001', 'U002', this.currentUserId];
    }

    const activeMemberId = memberIds[index % memberIds.length];
    const slotIndex = index % memberIds.length;
    
    this.messageSubject.next({
      type: 'TURN_SHIFT',
      data: {
        newActiveMemberId: activeMemberId,
        slotIndex: slotIndex,
        turnIndex: index,
        nextUtterance: {
           sequenceId: index + 1,
           speakerLabel: `Speaker ${slotIndex + 1}`,
           englishText: this.getSampleText(index),
           hintText: "Practice this sentence aloud."
        }
      }
    });
  }

  private getSampleText(index: number): string {
    const texts = [
      "I have been practicing my English every morning.",
      "She has been living in Hyderabad for five years.",
      "We should be arriving at the station by noon.",
      "The kids must be sleeping now because it's late.",
      "Can you help me with this grammar drill?"
    ];
    return texts[index % texts.length];
  }

  // Functional helper for manual simulation
  simulateMessage(type: string, data: any) {
    this.messageSubject.next({ type, data });
  }
}

export const websocketService = new WebsocketService();
