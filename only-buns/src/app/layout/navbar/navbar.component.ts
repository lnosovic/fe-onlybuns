import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../../user/models/user.model';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports:[
    CommonModule,
    RouterModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit{
  currentUser:any;
  constructor(private router:Router,private http:HttpClient){}
  ngOnInit(): void {
    this.currentUser=null;
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem("jwt") || '';
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      });
  
      if (token) {
        this.http.get<User>('http://localhost:8080/api/users/userInfo', { headers }).subscribe({
          next: (res) => {
            this.currentUser = res;
          },
        });
      }
    }
  }
  posts(){
    this.router.navigate(["posts"]);
  }
  login(){
    this.router.navigate(["login"]);
  }
  logout(){
    localStorage.removeItem('jwt');
    this.router.navigate(['login']);
  }
  profile(){
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem("jwt") || '';
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      });
  
      if (token) {
        this.http.get<User>('http://localhost:8080/api/users/userInfo', { headers }).subscribe({
          next: (res) => {
            this.currentUser = res;
            this.router.navigate(['profile',this.currentUser.id])
          },
        });
      }
    }
  }
  trends(){
    this.router.navigate(['trends']);
  }
  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('jwt');
    }
    return null;
  }
}
