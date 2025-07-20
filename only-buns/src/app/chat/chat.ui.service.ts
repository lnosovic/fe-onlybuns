import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ChatWindowState {
  id: number;
  name: string;
  position: { right: number; bottom: number };
}

@Injectable({ providedIn: 'root' })
export class ChatUiService {
  private windows$ = new BehaviorSubject<ChatWindowState[]>([]);

  windowWidth = 320; // DaisyUI card w-80 je 320px
  windowSpacing = 16; // Razmak između prozora (npr. tailwind p-4 je 16px)
  chatWidgetWidth = 320; // Širina glavnog chat widgeta (da bi se chat prozori pozicionirali pored njega)
  initialRightOffset = 16; // bottom-4 right-4 na glavnom widgetu, da bi se prvi prozor postavio desno od njega

  /** Observable koji čitaju AppComponent i drugi */
  openWindows$ = this.windows$.asObservable();



  openWindow(room: { id: number; name: string }) {
    const exists = this.windows$.value.some(w => w.id === room.id);
    if (!exists) {
      const nextPos = this.nextPosition();
      this.windows$.next([
        ...this.windows$.value,
        { id: room.id, name: room.name, position: nextPos }
      ]);
    }
  }
  isChatWindowOpen(roomId: number){
    const exists = this.windows$.value.some(w => w.id === roomId);
    if(!exists){
      return false;
    }
    else{
      return true;
    }
  }
  
  closeWindow(roomId: number) {
    this.windows$.next(this.windows$.value.filter(w => w.id !== roomId));
    this.repositionChatWindows();
  }

  private nextPosition() {
    const { length } = this.windows$.value;
    return { right: this.initialRightOffset + this.chatWidgetWidth+
        this.windowSpacing + (length*(this.windowWidth+this.windowSpacing)), bottom: 20 };
  }

  private repositionChatWindows(): void {
    const updated = this.windows$.value.map((w, index) => ({
      ...w,
      position: {
        right: this.initialRightOffset + this.chatWidgetWidth + this.windowSpacing +
          (index * (this.windowWidth + this.windowSpacing)),
        bottom: 20
      }
    }));
  
    this.windows$.next(updated);
  }
}