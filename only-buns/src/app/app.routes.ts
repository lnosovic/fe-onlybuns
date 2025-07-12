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
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminGuard } from './user/auth/admin.guard';
import { PostDetailsComponent } from './post/post-details/post-details.component';
import { EditProfileComponent } from './user/edit-profile/edit-profile.component';

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
    { path: 'admin', component: AdminDashboardComponent, canActivate: [AdminGuard] }, // <-- DODAJ canActivate: [AdminGuard]
    { path: 'post/:id', component: PostDetailsComponent },
    { path: 'edit-profile', component: EditProfileComponent},



    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: '**', redirectTo: 'home' }
    // Dodajte druge rute po potrebi
  ];
  
