// src/app/app.component.ts

import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common'; // <-- OBAVEZNO ZA *ngFor
import { NavbarComponent } from './layout/navbar/navbar.component';
import { ChatWidgetComponent } from './chat/chat-widget/chat-widget.component';
import { ChatWindowComponent } from './chat/chat-window/chat-window.component';
import { AuthService } from './user/auth.service';
import { ChatUiService } from './chat/chat.ui.service';
import { ChatService } from './chat/chat.service';
import { ChatWebSocketService } from './chat/chat.websocket.service';
import { filter, skip } from 'rxjs';
import { AdminDashboardComponent } from "./admin/admin-dashboard/admin-dashboard.component";
import { MemberManagerComponent } from "./chat/member-manager/member-manager.component";
import { User } from './user/models/user.model';

// Interfejs za otvoren prozor chata - SA pozicionim podacima
interface OpenChatWindow {
  id: number;
  name: string;

  position: { right: number; bottom: number }; // <-- POTREBNO ZA DINAMIČKO POZICIONIRANJE
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    RouterOutlet,
    CommonModule,
    ChatWidgetComponent,
    ChatWindowComponent,
    NavbarComponent,
    AdminDashboardComponent,
    MemberManagerComponent
],
})
export class AppComponent implements OnInit{
  title = 'only-buns';


  showMemberManager = false;

  memberData: {
    roomId: number;
    currentUserId: number;
    currentMembers: User[];
  } | null = null;

  // Handler za event iz chat-window
  handleMemberManager(data: { roomId: number; currentUserId: number; currentMembers: User[] }) {
    console.log('setting md');
    console.log(data);
    this.memberData = data;
    this.showMemberManager = true;
  }

  closeMemberManager() {
    this.showMemberManager = false;
    this.memberData = null;
  }
  
  openChatWindows: OpenChatWindow[] = [];
  firstInit = true;
  // Pomoćne promenljive za izračunavanje pozicije (koriste se u TS logici)
  windowWidth = 320; // DaisyUI card w-80 je 320px
  windowSpacing = 16; // Razmak između prozora (npr. tailwind p-4 je 16px)
  chatWidgetWidth = 320; // Širina glavnog chat widgeta (da bi se chat prozori pozicionirali pored njega)
  initialRightOffset = 16; // bottom-4 right-4 na glavnom widgetu, da bi se prvi prozor postavio desno od njega

  constructor(private authService: AuthService, private chatUi: ChatUiService,     private chatWebSocketService: ChatWebSocketService,
    private chatService: ChatService) { }

  ngOnInit() {
    this.chatUi.openWindows$.subscribe(ws => (this.openChatWindows = ws));
    // this.wsService.messageSubjects$.subscribe((message) => {
    //   console.log('💬 Nova poruka:', message);
    //   this.chatService.refreshMyChatRooms();
    // });
    this.chatService.refreshMyChatRooms();
    this.chatService.subscribeToNewRooms();
    
    this.chatService.newRoom$.subscribe(roomId => {
      if (roomId) {
        this.chatService.refreshMyChatRooms();
      }
    });
    //ne pitaj
    this.chatService.refreshMyChatRooms();
    this.chatService.refreshCompleted.subscribe(() => {
      // sve sobe su učitane i pretplate su postavljene
      // možemo slušati poruke iz svih soba
      for (const room of this.chatService.myChatRooms$.value) {
        this.chatWebSocketService
          .subscribeToRoom(room.id)
          .pipe(skip(1))          //da se prvi put ne otvore sve xd
          .subscribe((messages) => {
            const latest = messages[messages.length - 1];
            if (!this.chatUi.isChatWindowOpen(room.id)) {
              const updatedRooms = this.chatService.myChatRooms$.value.map(r =>
                r.id === room.id ? { ...r } : r
              );
              this.chatService.myChatRooms$.next(updatedRooms);

              const roomToOpen = {
                id: room.id,
                name: room.name || '?'
              };

                console.log('otvara');
                this.chatUi.openWindow(roomToOpen);
            }
          });

      }
      const currentRoomIds = new Set(this.chatService.myChatRooms$.value.map(r => r.id));
      const invalidWindows = this.openChatWindows.filter(w => !currentRoomIds.has(w.id));
      for (const w of invalidWindows) {
        console.warn(`Zatvaram prozor sobe ${w.name} jer korisnik više nije član.`);
        this.chatUi.closeWindow(w.id);
      }
    });
  }

  /**
   * Called when ChatWidgetComponent emits an 'openChatRoom' event.
   * Opens a new chat window or focuses on an existing one.
   */
  handleOpenChatRoom(event: { id: number, name: string }): void {
    // const existingWindow = this.openChatWindows.find(w => w.id === event.id);

    // if (!existingWindow) {
    //   const newWindow: OpenChatWindow = {
    //     id: event.id,
    //     name: event.name,
    //     position: {
    //       // Izračunavamo 'right' poziciju:
    //       // Inicijalni razmak od desne ivice (npr. 16px)
    //       // + širina glavnog chat widgeta (320px)
    //       // + razmak između widgeta i prvog prozora (16px)
    //       // + indeks trenutnog prozora * (širina prozora + razmak između prozora)
    //       right: this.initialRightOffset + this.chatWidgetWidth + this.windowSpacing +
    //              (this.openChatWindows.length * (this.windowWidth + this.windowSpacing)),
    //       bottom: this.initialRightOffset // Ista 'bottom' pozicija kao widget
    //     }
    //   };
    //   this.openChatWindows.push(newWindow);
    //   console.log('Opened new chat window:', newWindow);
    // } else {
    //   console.log('Chat window already open:', existingWindow.name);
    //   // Opciono: Možeš ovde da implementiraš logiku za pomeranje postojećeg prozora na vrh z-indexa
    // }
    const chatRoom = {
      id: event.id,
      name: event.name ?? 'Chat'
    };
    this.chatUi.openWindow(chatRoom)
  }

  

  isAuthenticated(){
    return this.authService.isAuthenticated();
  }
  isAdmin(){
    return this.authService.isAdmin();
  }

  /**
   * Closes a specific chat window.
   * @param chatRoomId The ID of the chat room to close.
   */
  // handleCloseChatWindow(chatRoomId: number): void {
  //   this.openChatWindows = this.openChatWindows.filter(w => w.id !== chatRoomId);
  //   // Prilagodi pozicije preostalih prozora nakon zatvaranja
  //   this.repositionChatWindows();
  //   console.log(`Closed chat window: ${chatRoomId}`);
  // }

  handleCloseChatWindow(roomId: number) {
    this.chatUi.closeWindow(roomId);
  }

  // Funkcija za prepozicioniranje prozora nakon zatvaranja
  private repositionChatWindows(): void {
    this.openChatWindows.forEach((window, index) => {
      // Ponovo izračunaj poziciju za svaki preostali prozor
      window.position.right = this.initialRightOffset + this.chatWidgetWidth + this.windowSpacing +
                              (index * (this.windowWidth + this.windowSpacing));
    });
  }
}