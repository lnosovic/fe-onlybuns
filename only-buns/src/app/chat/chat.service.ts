import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, forkJoin, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

import { ChatMessageDTO, ChatMessageResponseDTO, ChatRoom, CreatePersonalChatRequest } from './chat.model';
import { User } from '../user/models/user.model';
import { ChatWebSocketService } from './chat.websocket.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:8080/api/chat'; // Bazni URL tvog backend chat kontrolera
  public myChatRooms$ = new BehaviorSubject<ChatRoom[]>([]);
  refreshCompleted = new Subject<void>();

  private newRoomSubject = new Subject<number>();
  newRoom$ = this.newRoomSubject.asObservable();


  currentUser:User={
    id:0,
    name: '',
    surname: '',
    username: '',
    email: '',
    role: {id:0, name:''},
    location: {id:0,longitude:0,latitude:0,country:'',city:''},
    postCount: 0,
    followerCount: 0,
    followingCount: 0    
  }

  constructor(private http: HttpClient, private chatWebSocketService: ChatWebSocketService) {
    this.loadCurrentUser().then(() => {
      console.log('cs init');
    });
  }

  // async ngOnInit() {
  //   await this.loadCurrentUser();
  //   console.log('cs init');
  // }

  // Pomoćna funkcija za dobijanje HTTP hedera sa JWT tokenom.
  // OVO JE KRITIČNO I MORAŠ JE IMPLEMENTIRATI PRAVILNO U STVARNOJ APLIKACIJI!
  // Npr. dobijanje tokena iz Angular Auth servisa, localStorage-a, session-storage-a, itd.
  
  async loadCurrentUser():Promise<void>{
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem("jwt") || '';
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      });
      if(token){
        const currentUser = await firstValueFrom(this.http.get<User>('http://localhost:8080/api/users/userInfo', { headers }));
        this.currentUser = currentUser;
      }
    }
  }
  
  private getAuthHeaders(): HttpHeaders {
    // PRIMER: Dobijanje tokena iz localStorage-a. Zameni ovo sa tvojom stvarnom logikom!
    const token = localStorage.getItem('jwt'); // Pretpostavka da token čuvaš kao 'jwt_token'
    if (token) {
      return new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    } else {
      // Ako nema tokena, vrati samo Content-Type. Backend će verovatno odbiti zahtev sa 401/403.
      console.warn("JWT token not found. API requests might fail.");
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
  }
  getMyChatRoomsObservable(): Observable<ChatRoom[]> {
    return this.myChatRooms$.asObservable();
  }

  // refreshMyChatRooms(): void {
  //   this.http
  //     .get<ChatRoom[]>(`${this.apiUrl}/rooms/my-chatrooms`, {
  //       headers: this.getAuthHeaders(),
  //     })
  //     .pipe(
  //       // za svaki room uzmi i učesnike
  //       switchMap((rooms) => {
  //         if (!rooms.length) return of([]);                // nema soba → vrati prazan niz
  
  //         const roomsWithParticipants$ = rooms.map((room) =>
  //           this.getParticipants(room.id).pipe(
  //             map((participants) => ({
  //               ...room,
  //               participants,                              // popuni učesnike
  //             })),
  //             catchError(() => of({ ...room, participants: [] })) // ako padne, stavi prazan niz
  //           )
  //         );
  
  //         return forkJoin(roomsWithParticipants$);         // sačekaj da SVI pozivi završe
  //       }),
  //       catchError((err) => {
  //         console.error('Failed to load chat rooms or participants', err);
  //         return of([]);                                   // vrati prazan niz na grešku
  //       })
  //     )
  //     .subscribe((roomsWithParticipants) =>
  //       this.myChatRooms$.next(roomsWithParticipants)
  //     );
  // }
  async refreshMyChatRooms(): Promise<void> {
    await this.loadCurrentUser();
    this.http
      .get<ChatRoom[]>(`${this.apiUrl}/rooms/my-chatrooms`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        switchMap((rooms) => {
          if (!rooms.length) return of([]);
  
          const roomsWithParticipants$ = rooms.map((room) =>
            this.getParticipants(room.id).pipe(
              map((participants) => {
                const fullRoom: ChatRoom = {
                  ...room,
                  participants,
                };
  
                // ⬇️ Setuj ime ovde ako nije već definisano
                fullRoom.name = this.setChatName(fullRoom);
  
                this.chatWebSocketService.subscribeToRoom(room.id);

                return fullRoom;
              }),
              catchError(() =>
                of({
                  ...room,
                  participants: [],
                  name: room.name ?? 'Nepoznat', // fallback ako padne poziv
                })
              )
            )
          );
  
          return forkJoin(roomsWithParticipants$);
        }),
        catchError((err) => {
          console.error('Failed to load chat rooms or participants', err);
          return of([]);
        })
      )
      .subscribe((roomsWithParticipants) =>{
        this.myChatRooms$.next(roomsWithParticipants);
        this.refreshCompleted.next();
        }

      );
  }
  /**
   * Kreira personalni chat između ulogovanog korisnika i drugog korisnika.
   * Backend endpoint: POST /api/chat/rooms/personal/create
   *
   * @param otherUserId - ID drugog korisnika sa kojim se kreira chat (tipa 'number' na frontendu).
   * @returns Observable<ChatRoom> - Observable koji emituje kreiranu chat sobu.
   */
  // createPersonalChat(otherUserId: number): Observable<ChatRoom> {
  //   const body: CreatePersonalChatRequest = { otherUserId: otherUserId };

  //   console.log(`[ChatService] Slanje zahteva za kreiranje personalnog chata sa otherUserId: ${otherUserId}`);

  //   return this.http.post<ChatRoom>(`${this.apiUrl}/rooms/personal/create`, body, { headers: this.getAuthHeaders() })
  //     .pipe(
  //       // Koristi catchError za rukovanje greškama koje dolaze sa backend API-ja
  //       catchError(this.handleError)
  //     );
  // }
  // createPersonalChat(otherUserId: number): Observable<ChatRoom> {
  //   const body: CreatePersonalChatRequest = { otherUserId: otherUserId };
  //   return this.http.post<ChatRoom>(`${this.apiUrl}/rooms/personal/create`, body, { headers: this.getAuthHeaders() })
  //     .pipe(tap(newRoom => {
  //       const currentRooms = this.myChatRooms$.value;
  //       // Dodaj novu sobu ako ne postoji
  //       if (!currentRooms.find(r => r.id === newRoom.id)) {
  //         this.myChatRooms$.next([...currentRooms, newRoom]);
  //       }
  //     }));
  // }
  createPersonalChat(otherUserId: number): Observable<ChatRoom> {
    const body: CreatePersonalChatRequest = { otherUserId };
  
    return this.http
      .post<ChatRoom>(
        `${this.apiUrl}/rooms/personal/create`,
        body,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        switchMap(newRoom =>
          this.getParticipants(newRoom.id).pipe(
            map(participants => {
              const roomWithParticipants: ChatRoom = { ...newRoom, participants, new: true };
              const resolvedName = this.setChatName(roomWithParticipants);
              return { ...roomWithParticipants, name: resolvedName };
            }),
            catchError(() => of({ ...newRoom, participants: [], name: 'Nepoznat' }))
          )
        ),
        tap(fullRoom => {
          const current = this.myChatRooms$.value;
          if (!current.find(r => r.id === fullRoom.id)) {
            this.myChatRooms$.next([...current, fullRoom]);
          }
        })
      );
  }

    // getMyChatRooms(): Observable<ChatRoom[]> {
    //   return this.http.get<ChatRoom[]>(`${this.apiUrl}/rooms/my-chatrooms`, { headers: this.getAuthHeaders() })
    //     .pipe(
    //       catchError(this.handleError)
    //     );
    // }
    getMyChatRooms(): Observable<ChatRoom[]> {
      console.log('getting m cry')
      return this.http.get<ChatRoom[]>(`${this.apiUrl}/rooms/my-chatrooms`, { headers: this.getAuthHeaders() })
        .pipe(
          switchMap(chatRooms => {
            if (!chatRooms.length) return of([]);
    
            const roomsWithParticipants$ = chatRooms.map(room =>
              this.getParticipants(room.id).pipe(
                map(participants => ({
                  ...room,
                  participants: participants
                })),
                catchError(() => of({ ...room, participants: [] }))
              )
            );
            console.log(roomsWithParticipants$);
            return forkJoin(roomsWithParticipants$);
          }),
          catchError(this.handleError)
        );

    }
  // getMyChatRooms():Observable<ChatRoom[]> {
  //      return this.http.get<ChatRoom[]>(`${this.apiUrl}/rooms/my-chatrooms`, { headers: this.getAuthHeaders() })
  //     .pipe(
  //       switchMap(rooms => {
  //         if (rooms.length === 0) return of([]);
    
  //         // Za svaki room pozovi getParticipants i spoji rezultate
  //         const roomsWithParticipants$ = rooms.map(room =>
  //           this.getParticipants(room.id).pipe(
  //             map(participants => ({
  //               ...room,
  //               participants
  //             }))
  //           )
  //         );
    
  //         return forkJoin(roomsWithParticipants$);
  //       }),
  //       catchError(err => {
  //         console.error(err);
  //         return of([]);
  //       })
  //     );
  // }

  getParticipants(chatRoomId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${chatRoomId}/participants`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  loadMyChatRooms(): void {
    this.http.get<ChatRoom[]>(`${this.apiUrl}/rooms/my-chatrooms`, { headers: this.getAuthHeaders() })
      .subscribe(rooms => {
        this.myChatRooms$.next(rooms);
      });
  }

  getChatHistory(roomId: number): Observable<ChatMessageResponseDTO[]> {
    return this.http.get<ChatMessageResponseDTO[]>(
      `${this.apiUrl}/messages/history/${roomId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  sendMessage(messageDTO: ChatMessageDTO): Observable<ChatMessageResponseDTO> {
    return this.http.post<ChatMessageResponseDTO>(
      `${this.apiUrl}/messages/send`,
      messageDTO,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  setChatName(room : ChatRoom){
    if (room.name){
      return room.name;
    }
    else if(this.currentUser.id != 0){
      return room.participants.find(p => p.id !== this.currentUser?.id)?.username ?? 'Nepoznat';
    } 
    return 'Unknown';
  }


  createGroupChat(groupName: string): Observable<ChatRoom> {
    return this.http.post<ChatRoom>(
      `${this.apiUrl}/rooms/group/create`,
      { name: 'nova chat grupa' },
      { headers: this.getAuthHeaders() }
    );
  }

  addUserToGroup(roomId: number, userId: number): Observable<ChatRoom> {
    return this.http.post<ChatRoom>(
      `${this.apiUrl}/rooms/group/${roomId}/add`,
      { userId },
      { headers: this.getAuthHeaders() }
    );
  }

  setRoomNewStatus(roomId: number): void {
    const currentRooms = this.myChatRooms$.value;
  
    const updatedRooms = currentRooms.map(room =>
      room.id === roomId ? { ...room, new: true } : room
    );
  
    this.myChatRooms$.next(updatedRooms);
  }

  async subscribeToNewRooms():Promise<void> {
    await this.loadCurrentUser();
    console.log('sub user', this.currentUser.id, 'to new rooms');
    this.chatWebSocketService.waitForConnection();
    this.chatWebSocketService.subscribeToNewRooms(this.currentUser.id);
    this.chatWebSocketService.newRoom$.subscribe(roomId => {
      if (roomId) {
        console.log('🔁 Nova soba stigla, refrešujem...');
        this.refreshMyChatRooms();
      }
    });
  }


  getAdminId(chatRoomId: number): Observable<number> {
    return this.http.get<number>(`http://localhost:8080/api/chat/${chatRoomId}/adminId`) || 0;
  }

  /**
   * Pomoćna funkcija za centralizovano rukovanje HTTP greškama.
   * @param error - Objekat greške koji vraća HttpClient.
   * @returns Observable<never> - Observable koji baca grešku.
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Došlo je do nepoznate greške!';
    if (error.error instanceof ErrorEvent) {
      // Greška na strani klijenta ili mreže.
      errorMessage = `Greška na klijentskoj strani: ${error.error.message}`;
    } else {
      // Greška na strani servera.
      // Greška.error sadrži telo odgovora sa servera (obično JSON sa porukom).
      // Ako je backend bacio RuntimeException, 'error.error' će biti ta poruka.
      errorMessage = `Serverska greška: Status ${error.status} - ${error.error || error.message}`;
      console.error(`Backend vratio status kod ${error.status}, odgovor: `, error.error);
    }
    console.error(errorMessage);
    // Vraćamo Observable koji baca grešku kako bi komponenta mogla da je obradi.
    return throwError(() => new Error(errorMessage));
  }



  
}