
export interface ChatRoom {
    id: number;
    name: string | null;
    groupChat: boolean; // Pazi, na backendu je 'isGroupChat', a ovde 'groupChat' ako Angular mapira tako
    admin?: User;
    participants: User[];
    // Dodaj ostala polja koja ti dolaze sa backenda
  }
  
  export interface User {
    id: number;
    username: string;
    // Dodaj ostala polja Usera koja su ti potrebna na frontendu
  }
  
  // Interfejs za request body kada kreiramo personalni chat
  export interface CreatePersonalChatRequest {
    otherUserId: number; // Ovo je ID drugog korisnika koji šalješ
  }
  
  // --- Ostali DTO-ovi/Modeli (za buduću upotrebu) ---
  export interface ChatMessageResponseDTO {
    id: number;
    roomId: number;
    senderId: number;
    senderUsername: string;
    content: string;
    timestamp: string;
  }
  
  export interface ChatMessageDTO {
    roomId: number;
    content: string;
  }
  
  export interface CreateGroupChatRequest {
    name: string;
  }
  
  export interface UserToGroupRequest {
    userId: number;
  }