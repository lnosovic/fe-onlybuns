// src/app/app.component.ts

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common'; // <-- OBAVEZNO ZA *ngFor
import { NavbarComponent } from './layout/navbar/navbar.component';
import { ChatWidgetComponent } from './chat/chat-widget/chat-widget.component';
import { ChatWindowComponent } from './chat/chat-window/chat-window.component';
import { AuthService } from './user/auth.service';

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
    NavbarComponent
  ],
})
export class AppComponent {
  title = 'only-buns';

  openChatWindows: OpenChatWindow[] = [];

  // Pomoćne promenljive za izračunavanje pozicije (koriste se u TS logici)
  windowWidth = 320; // DaisyUI card w-80 je 320px
  windowSpacing = 16; // Razmak između prozora (npr. tailwind p-4 je 16px)
  chatWidgetWidth = 320; // Širina glavnog chat widgeta (da bi se chat prozori pozicionirali pored njega)
  initialRightOffset = 16; // bottom-4 right-4 na glavnom widgetu, da bi se prvi prozor postavio desno od njega

  constructor(private authService: AuthService) { }

  /**
   * Called when ChatWidgetComponent emits an 'openChatRoom' event.
   * Opens a new chat window or focuses on an existing one.
   */
  handleOpenChatRoom(event: { id: number, name: string }): void {
    const existingWindow = this.openChatWindows.find(w => w.id === event.id);

    if (!existingWindow) {
      const newWindow: OpenChatWindow = {
        id: event.id,
        name: event.name,
        position: {
          // Izračunavamo 'right' poziciju:
          // Inicijalni razmak od desne ivice (npr. 16px)
          // + širina glavnog chat widgeta (320px)
          // + razmak između widgeta i prvog prozora (16px)
          // + indeks trenutnog prozora * (širina prozora + razmak između prozora)
          right: this.initialRightOffset + this.chatWidgetWidth + this.windowSpacing +
                 (this.openChatWindows.length * (this.windowWidth + this.windowSpacing)),
          bottom: this.initialRightOffset // Ista 'bottom' pozicija kao widget
        }
      };
      this.openChatWindows.push(newWindow);
      console.log('Opened new chat window:', newWindow);
    } else {
      console.log('Chat window already open:', existingWindow.name);
      // Opciono: Možeš ovde da implementiraš logiku za pomeranje postojećeg prozora na vrh z-indexa
    }
  }

  isAuthenticated(){
    return this.authService.isAuthenticated();
  }

  /**
   * Closes a specific chat window.
   * @param chatRoomId The ID of the chat room to close.
   */
  handleCloseChatWindow(chatRoomId: number): void {
    this.openChatWindows = this.openChatWindows.filter(w => w.id !== chatRoomId);
    // Prilagodi pozicije preostalih prozora nakon zatvaranja
    this.repositionChatWindows();
    console.log(`Closed chat window: ${chatRoomId}`);
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