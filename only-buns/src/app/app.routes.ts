import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PostsPreviewComponent } from './post/posts-preview/posts-preview.component';

export const routes: Routes = [
    { path: 'posts', component: PostsPreviewComponent },
    // Dodajte druge rute po potrebi
  ];
  
