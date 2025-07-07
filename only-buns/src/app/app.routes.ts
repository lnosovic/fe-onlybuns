import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PostsPreviewComponent } from './post/posts-preview/posts-preview.component';
import { ProfileComponent } from './user/profile/profile.component';
import { LoginComponent } from './user/login/login.component';
import { RegistrationComponent } from './user/registration/registration.component';
import { ActivateUserComponent } from './user/activate-user/activate-user.component';
import { TrendsComponent } from './post/trends/trends.component';
import { MapComponent } from './layout/map/map.component';
import { PostsMapComponent } from './post/posts-map/posts-map.component';

export const routes: Routes = [
    { path: 'posts', component: PostsPreviewComponent },
    { path: 'profile/:id',component:ProfileComponent},
    { path: 'login',component:LoginComponent},
    { path: 'sign-up',component:RegistrationComponent},
    { path: 'activation/:id', component:ActivateUserComponent},
    { path: 'home',component:PostsPreviewComponent},
    { path: 'trends',component:TrendsComponent},
    { path: 'map',component:MapComponent},
    { path: 'posts-map', component:PostsMapComponent},
    // Dodajte druge rute po potrebi
  ];
  
