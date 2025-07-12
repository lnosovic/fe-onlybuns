// src/app/chat/chat-widget/chat-widget.component.ts

import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, firstValueFrom, Observable, of, tap } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { User } from '../../user/models/user.model';
import { ChatService } from '../chat.service';


@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.css']
})
export class ChatWidgetComponent implements OnInit {

  isWidgetOpen: boolean = false;
  // Neće više imati activeChatRoomId/Name ovde, već će emitovati događaj
  @Output() openChatRoom = new EventEmitter<{ id: number, name: string }>();

  // Placeholder za tvoje recent chatove
  recentChats = [
    { id: 1, name: 'Grupa A', lastMessage: 'Poslednja poruka...' },
    { id: 2, name: 'Marko Marković', lastMessage: 'Ok, vidimo se.' },
    { id: 3, name: 'Jelena Petrović', lastMessage: 'Super ideja!' },
    { id: 4, name: 'Podrška', lastMessage: 'Imamo rešenje za vaš problem.' },
  ];
  currentUser:User | null={
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

  constructor(private http:HttpClient, private chatService: ChatService) { }

  ngOnInit(): void {
    console.log('cw comp');
    this.loadCurrentUser().then(()=>{
      this.chatService.getMyChatRooms();
      console.log(this.chatService.getMyChatRooms().forEach(e => console.log(e)));
      this.loadRecentChats();
    });

   }






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


  toggleWidget(): void {
    this.isWidgetOpen = !this.isWidgetOpen;
  }

  loadRecentChats(): void {
    this.recentChats = []; // Isprazni trenutno
  
    this.chatService.getMyChatRooms().subscribe({
      next: (chatRooms) => {
        this.recentChats = chatRooms.map(room => ({ id: room.id,  name: 'Grupa A', lastMessage: 'Poslednja poruka...'  }));
        console.log('Recent chats:', this.recentChats);
      },
      error: (err) => {
        console.error('Greška pri učitavanju chat soba:', err);
      }
    });
  }

  // Sada emitujemo događaj roditelju
  onOpenChat(chatRoomId: number, chatRoomName: string): void {
    this.openChatRoom.emit({ id: chatRoomId, name: chatRoomName });
    // Opciono: možeš zatvoriti widget nakon otvaranja prozora, ili ga ostaviti otvorenim
    // this.isWidgetOpen = false;
  }
}