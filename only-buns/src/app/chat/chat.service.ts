import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ChatMessageDTO, ChatMessageResponseDTO, ChatRoom, CreatePersonalChatRequest } from './chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:8080/api/chat'; // Bazni URL tvog backend chat kontrolera

  constructor(private http: HttpClient) { }

  // Pomoćna funkcija za dobijanje HTTP hedera sa JWT tokenom.
  // OVO JE KRITIČNO I MORAŠ JE IMPLEMENTIRATI PRAVILNO U STVARNOJ APLIKACIJI!
  // Npr. dobijanje tokena iz Angular Auth servisa, localStorage-a, session-storage-a, itd.
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

  /**
   * Kreira personalni chat između ulogovanog korisnika i drugog korisnika.
   * Backend endpoint: POST /api/chat/rooms/personal/create
   *
   * @param otherUserId - ID drugog korisnika sa kojim se kreira chat (tipa 'number' na frontendu).
   * @returns Observable<ChatRoom> - Observable koji emituje kreiranu chat sobu.
   */
  createPersonalChat(otherUserId: number): Observable<ChatRoom> {
    const body: CreatePersonalChatRequest = { otherUserId: otherUserId };

    console.log(`[ChatService] Slanje zahteva za kreiranje personalnog chata sa otherUserId: ${otherUserId}`);

    return this.http.post<ChatRoom>(`${this.apiUrl}/rooms/personal/create`, body, { headers: this.getAuthHeaders() })
      .pipe(
        // Koristi catchError za rukovanje greškama koje dolaze sa backend API-ja
        catchError(this.handleError)
      );
  }

  getMyChatRooms(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${this.apiUrl}/rooms/my-chatrooms`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
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