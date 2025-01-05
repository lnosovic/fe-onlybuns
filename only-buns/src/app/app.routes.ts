import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PostsPreviewComponent } from './post/posts-preview/posts-preview.component';
import { ProfileComponent } from './user/profile/profile.component';

export const routes: Routes = [
    { path: 'posts', component: PostsPreviewComponent },
    { path: 'profile/:id',component:ProfileComponent},
    // Dodajte druge rute po potrebi
  ];
  
