

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatWidgetComponent } from './chat-widget/chat-widget.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule, 
    ChatWidgetComponent,
    FormsModule
  ],
  exports: [
    ChatWidgetComponent
  ]
})
export class ChatModule { }