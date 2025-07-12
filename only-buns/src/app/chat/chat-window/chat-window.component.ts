// src/app/chat/chat-window/chat-window.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common'; // Za *ngIf, *ngFor
 import { FormsModule } from '@angular/forms'; // Ako ćeš imati ngModel za input polje
import { ChatService } from '../chat.service';
import { ChatMessageDTO, ChatMessageResponseDTO } from '../chat.model';
import { User } from '../../user/models/user.model';
import { AuthService } from '../../user/auth.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { ChatWebSocketService } from '../chat.websocket.service';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit, OnDestroy {

  @Input() chatRoomId!: number;
  @Input() chatRoomName!: string;
  @Output() closeWindow = new EventEmitter<number>();

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  currentUser!: User; // definisan, ali će se učitati async
  messageContent: string = '';
  messages: ChatMessageResponseDTO[] = [];

  private messagesSub?: Subscription;

  constructor(
    private chatWebSocketService: ChatWebSocketService,
    private chatService: ChatService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    // 1. Učitaj trenutnog korisnika
    console.log('current room id', this.chatRoomId);
    console.log('init cwc');
    await this.chatWebSocketService.waitForConnection();


    // 2. Učitaj postojeću istoriju poruka (HTTP GET)


    // 3. Pretplati se na WebSocket poruke za ovu sobu
    this.messagesSub = this.chatWebSocketService.subscribeToRoom(this.chatRoomId)
      .subscribe((allMessagesForRoom) => {
        // Samo zameni postojeći niz sa novim, kompletnim nizom iz servisa
        console.log("Nova lista poruka:", allMessagesForRoom);
        this.messages = allMessagesForRoom;
        //this.loadMessages(this.chatRoomId);
        // Sortiranje više nije potrebno ovde, jer se niz već održava u servisu.
        // Ali ako želiš da budeš siguran, možeš ga ostaviti.

        // (opciono) scrolluj na dno chata
        this.scrollToBottom();
      });
    await this.loadCurrentUser();
    await this.loadMessages(this.chatRoomId);
  }

  async loadCurrentUser():Promise<void>{
    console.log('deez');
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem("jwt") || '';
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      });
      if(token){
        const currentUser = await firstValueFrom(this.http.get<User>('http://localhost:8080/api/users/userInfo', { headers }));
        this.currentUser = currentUser;
        console.log("CHAT-WINDOW:", this.currentUser, "USERNAME", this.currentUser.username);
      }
    }
  }

  async loadMessages(roomId: number) {
    this.chatService.getChatHistory(roomId).subscribe({
      next: (messages) => {
        this.messages = messages//.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const subject = this.chatWebSocketService['messagesSubjects'].get(roomId);
        if(subject) subject.next(this.messages);
        console.log('loaded messages for room', roomId);
        //this.scrollToBottom();
      },
      error: (err) => {
        console.error('Failed to load messages:', err);
      }
    });
  }
  isSending = false;
  // sendMessage() {
  //   this.isSending= true;
  //   const trimmed = this.messageContent.trim();
  //   if (!trimmed) return;

  //   const messageToSend = {
  //     roomId: this.chatRoomId,
  //     content: trimmed,
  //     senderUsername: this.currentUser.username
  //   }
  //   console.log(messageToSend);
  //   this.chatWebSocketService.sendMessage(messageToSend);


  //   this.messageContent = '';
  //   this.isSending = false;
  // }
  // sendMessage() {
  //   const trimmedContent = this.messageContent.trim();
  //   if (!trimmedContent || this.isSending) return;
  
  //   const messageDTO: ChatMessageDTO = {
  //     roomId: this.chatRoomId,
  //     content: trimmedContent
  //   };
  
  //   this.isSending = true;
  
  //   this.chatService.sendMessage(messageDTO).subscribe({
  //     next: (savedMessage) => {
  //       // Napravi novi niz sa starim porukama + novom porukom
  //       this.messages = [...this.messages, savedMessage];
  
  //       // Sortiraj po vremenu (od najnovije ka najstarijoj)
  //       this.messages = this.messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  //       this.messageContent = '';
  //       this.isSending = false;
  
  //       // (opciono) automatski scroll na dno
  //       // this.scrollToBottom();
  //     },
  //     error: (err) => {
  //       console.error('Greška pri slanju poruke:', err);
  //       this.isSending = false;
  //     }
  //   });
  // }
  sendMessage() {
    const trimmedContent = this.messageContent.trim();
    if (!trimmedContent || this.isSending) return;
  
    const messageDTO: ChatMessageDTO = {
      roomId: this.chatRoomId,
      content: trimmedContent
    };
  
    this.isSending = true;
    console.log('saljem poruku');
    this.chatService.sendMessage(messageDTO).subscribe({
      next: () => {
        // Poruka je sačuvana, ali ne dodajemo odmah u this.messages
        // Očekujemo da će live update doći preko WebSocketa
        this.messageContent = '';
        this.isSending = false;
        this.scrollToBottom();
  
        // (opciono) automatski scroll na dno
        // this.scrollToBottom();
      },
      error: (err) => {
        console.error('Greška pri slanju poruke:', err);
        this.isSending = false;
      }
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Scroll error:', err);
      }
    }, 0); // timeout osigurava da Angular prvo renderuje poruke
  }

  onClose() {
    this.closeWindow.emit(this.chatRoomId);
  }

  ngOnDestroy() {
    console.log('des');
    this.messagesSub?.unsubscribe();
    this.chatWebSocketService.unsubscribeFromRoom(this.chatRoomId);
  }
}
