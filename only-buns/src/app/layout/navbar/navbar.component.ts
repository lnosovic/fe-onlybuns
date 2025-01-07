import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
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
  constructor(private router:Router){}
  ngOnInit(): void {
    this.currentUser=null;
  }
  posts(){
    this.router.navigate(["posts"]);
  }
  login(){
    this.router.navigate(["login"]);
  }
  logout(){

  }
}
