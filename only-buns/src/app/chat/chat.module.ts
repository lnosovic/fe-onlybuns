

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatWidgetComponent } from './chat-widget/chat-widget.component';


@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule, 
    ChatWidgetComponent,
  ],
  exports: [
    ChatWidgetComponent
  ]
})
export class ChatModule { }