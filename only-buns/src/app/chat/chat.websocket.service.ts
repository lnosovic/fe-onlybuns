import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatMessageResponseDTO } from './chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatWebSocketService {
    private client: Client;
    private messagesSubjects: Map<number, BehaviorSubject<ChatMessageResponseDTO[]>> = new Map();
    private subscriptions: Map<number, StompSubscription> = new Map();

    private newChatSubject = new BehaviorSubject<{ id: number; name: string;} | null>(null);
    public newChat$ = this.newChatSubject.asObservable();

    private newRoomSubjects = new BehaviorSubject<number | null>(null);
    public newRoom$ = this.newRoomSubjects.asObservable();


    private connectionPromise!: Promise<void>;
    private connectionResolver!: () => void;
    private isConnected = false;
    
  
  
    constructor() {
    //const token = localStorage.getItem('jwt') || '';
    
    this.connectionPromise = new Promise((resolve) => {
        this.connectionResolver = resolve;
        
      });

    this.client = new Client({
        brokerURL: undefined,
        // Ukloni token iz URL-a
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        reconnectDelay: 5000,
        debug: (str) => {
          console.log('[STOMP DEBUG]', str);
        },
        // Osloni se samo na hedere za slanje tokena
        connectHeaders: this.getConnectHeaders(),
        onConnect: () => {
          console.log('STOMP connected');
          this.isConnected = true;
          this.connectionResolver();
          this.client.subscribe('/topic/new-chat', (message: IMessage) => {
            const body = JSON.parse(message.body) as { id: number; name: string | null };
            console.log('🔔 Novi chat otvoren:', body);
            this.newChatSubject.next({ id: body.id, name: body.name ?? 'New Chat' });
          });
        },
        onStompError: (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Details: ' + frame.body);
        },
        onWebSocketClose: (evt) => {
            console.warn('WebSocket closed', evt);
        }
        
      });
    
    this.client.activate();

    //this.client.activate();
  }

  private getConnectHeaders(): { [key: string]: string } {
    const token = localStorage.getItem('jwt') || '';
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  async subscribeToNewRooms(userId: number): Promise<void> {
    await this.waitForConnection();
    console.log('primljen user', userId, ' u ws sub to new rooms');
    this.client.subscribe(`/topic/newChatRoom/${userId}`, (message: IMessage) => {
      const roomId = JSON.parse(message.body);
      console.log('📬 WS nova soba:', roomId);
      this.newRoomSubjects.next(roomId);
    });
  }
  // Pretplata na chatroom topic po ID sobe, vraća Observable za poruke te sobe
  subscribeToRoom(roomId: number): Observable<ChatMessageResponseDTO[]> {
    // Ako već imamo BehaviorSubject za tu sobu, samo ga vraćamo
    if (!this.messagesSubjects.has(roomId)) {
      this.messagesSubjects.set(roomId, new BehaviorSubject<ChatMessageResponseDTO[]>([]));
    }

    // Ako već imamo aktivnu pretplatu na tu sobu, samo vratimo Observable
    if (!this.subscriptions.has(roomId)) {
      const subscription = this.client.subscribe(`/topic/chatroom/${roomId}`, (message: IMessage) => {
        console.log("WebSocket PRIMIO poruku:", message.body);
        const body = JSON.parse(message.body) as ChatMessageResponseDTO;
        const subject = this.messagesSubjects.get(roomId);
        if (subject) {
          const currentMessages = subject.value//.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          // Dodaj novu poruku i emituj
          subject.next([...currentMessages, body]);
        }
      });
      this.subscriptions.set(roomId, subscription);
    }
    
    return this.messagesSubjects.get(roomId)!.asObservable();
  }


//   subscribeToRoom(roomId: number): Observable<ChatMessageResponseDTO[]> {
//     if (!this.messagesSubjects.has(roomId)) {
//       this.messagesSubjects.set(roomId, new BehaviorSubject<ChatMessageResponseDTO[]>([]));
//     }
  
//     if (!this.subscriptions.has(roomId)) {
//       const subscription = this.client.subscribe(`/topic/chatroom/${roomId}`, (message: IMessage) => {
//         const body = JSON.parse(message.body) as ChatMessageResponseDTO;
//         const subject = this.messagesSubjects.get(roomId);
//         if (subject) {
//           const currentMessages = subject.value;
//           subject.next([...currentMessages, body]);
//         }
//       });
//       this.subscriptions.set(roomId, subscription);
//     }
  
//     return this.messagesSubjects.get(roomId)!.asObservable();
//   }

  unsubscribeFromRoom(roomId: number): void {
    const sub = this.subscriptions.get(roomId);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(roomId);
    }
    this.messagesSubjects.delete(roomId);
  }

  sendMessage(messageDTO: { roomId: number; content: string, senderUsername: string }): void {
    if (this.client && this.client.connected) {
      this.client.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(messageDTO),
      });
    } else {
      console.error('WebSocket nije povezan.');
    }
  }

  async waitForConnection(): Promise<void> {
    if (this.isConnected) {
      return; // Ako je već konektovan, odmah se vraća
    }
    return this.connectionPromise; // Inače čeka dok se ne konektuje
  }

  
}
