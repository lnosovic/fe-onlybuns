import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  declarations: [],
  imports: [
    CommonModule // Only modules go here
  ],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    provideHttpClient() // Use provideHttpClient as a provider
  ]
})
export class PostModule { }
