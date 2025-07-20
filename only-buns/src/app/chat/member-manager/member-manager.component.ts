import { Component, Input, Output } from '@angular/core';
import { User } from '../../user/models/user.model';
import { UserService } from '../../user/user.service';
import { ChatService } from '../chat.service';
import { ChatUiService } from '../chat.ui.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventEmitter } from '@angular/core';
import { forkJoin } from 'rxjs';
@Component({
  selector: 'app-member-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule 
  ],
  templateUrl: './member-manager.component.html',
  styleUrls: ['./member-manager.component.css']
})
export class MemberManagerComponent {
  @Input() chatRoomId!: number;
  @Input() currentUserId!: number;
  @Input() currentMembers!: User[];

  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
  //currentUser!: User;

  //currentMembers: User[] = [];
  userSearch = '';
  searchResults: User[] = [];
  isGroup = false;
  showModal = true;
  adminId: number = 0;
  usersToBeAdded: User[] = [];
  usersToBeRemoved: User[] = [];
  groupChatName: string = '';

  constructor(
    private userService: UserService,
    private chatService: ChatService,
    private chatUi: ChatUiService
  ) {}

  ngOnInit() {
    this.loadParticipants();
    this.loadAdminId();
  }

  async loadAdminId() {
    if (!this.chatRoomId) return;
    try{
      this.chatService.getAdminId(this.chatRoomId).subscribe({
        next: (id) => {
          this.adminId = id;
          console.log('Admin ID:', this.adminId);
        },
        error: (err) => {
          this.adminId = 0;
          //console.error('❌ Greška pri dohvatanju admin ID-ja:', err);
          
        }
      });
    }
    catch{
      this.adminId = 0;
    }
  }

  loadParticipants() {
    if (!this.chatRoomId) return;
    this.chatService.getParticipants(this.chatRoomId).subscribe({
      next: (users) => {
        this.currentMembers = users;
        this.isGroup = users.length > 2;
      },
      error: () => {
        this.currentMembers = [];
      }
    });
  }

  searchUsers() {
    if (this.userSearch.trim().length < 2) {
      this.searchResults = [];
      return;
    }
  
    this.userService.searchUsersByUsername(this.userSearch.trim()).subscribe({
      next: (users) => {
        const currentIds = new Set(this.currentMembers.map(u => u.id));
        this.searchResults = users.filter(u => !currentIds.has(u.id));
      },
      error: () => {
        this.searchResults = [];
      }
    });
  }
  addUser(user: User) {
    // Ako je korisnik bio označen za brisanje, undo ga
    this.usersToBeRemoved = this.usersToBeRemoved.filter(u => u.id !== user.id);
  
    // Ako već postoji u currentMembers, ne dodaj ga opet
    if (!this.currentMembers.find(u => u.id === user.id)) {
      this.currentMembers.push(user);
    }
  
    // Ako još nije u pending za dodavanje, dodaj ga
    if (!this.usersToBeAdded.find(u => u.id === user.id)) {
      this.usersToBeAdded.push(user);
    }
  
    this.searchUsers(); // Osveži rezultate
  }

  removeUser(user: User) {
    // Ako je bio dodat u ovoj sesiji, izbaci ga iz pendingAddUsers
    this.usersToBeAdded = this.usersToBeAdded.filter(u => u.id !== user.id);
  
    // Ako već nije označen za uklanjanje, dodaj ga
    if (!this.usersToBeRemoved.find(u => u.id === user.id)) {
      this.usersToBeRemoved.push(user);
    }
  }
  
  undoRemoveUser(user: User) {
    this.usersToBeRemoved = this.usersToBeRemoved.filter(u => u.id !== user.id);
  }

  isMarkedForRemoval(user: User): boolean {
    return this.usersToBeRemoved.some(u => u.id === user.id);
  }

  updateGroupChat() {
    const addCalls = this.usersToBeAdded.map(user =>
      this.chatService.addUserToGroup(this.chatRoomId, user.id)
    );
    
    const removeCalls = this.usersToBeRemoved.map(user =>
      this.chatService.removeUserFromGroup(this.chatRoomId, user.id)
    );
  
    const allCalls = [...addCalls, ...removeCalls];
  
    if (allCalls.length === 0) {
      console.log('Nema izmena za slanje.');
      return;
    }
  
    forkJoin(allCalls).subscribe({
      next: results => {
        console.log('Grupa uspešno ažurirana:', results);
        this.chatService.refreshMyChatRooms();
        this.closeModal(); // ili emituj event ako treba da se zatvori
      },
      error: err => {
        console.error('Greška pri ažuriranju grupe:', err);
        console.log('Grupa uspešno ažurirana:');
        this.chatService.refreshMyChatRooms();
        this.closeModal(); // ili emituj event ako treba da se zatvori
      }
    });
  } 

  createGroupChat() {
    this.chatService.createGroupChat(this.groupChatName.trim() || 'New Group Chat').subscribe({
      next: (newGroup) => {
        const combined = [...this.currentMembers, ...this.usersToBeAdded];

        // 1. Ukloni korisnike koji su u usersToBeRemoved
        // 2. Ukloni duplikate po id‑ju
        const finalMembers = combined
          .filter(user => !this.usersToBeRemoved.find(u => u.id === user.id))
          .filter((user, index, self) =>
            index === self.findIndex(u => u.id === user.id)
          );
        const membersToAdd = finalMembers.filter(u => u.id !== this.currentUserId);
        const addCalls = membersToAdd.map(member =>
          this.chatService.addUserToGroup(newGroup.id, member.id)
        );
        Promise.all(addCalls.map(o => o.toPromise())).then(() => {
          this.chatService.refreshMyChatRooms();
          this.chatUi.openWindow({ id: newGroup.id, name: newGroup.name || 'Group Chat' });
          this.closeModal();
        });
      },
      error: (err) => console.error('Group creation failed', err)
    });
  }
}
