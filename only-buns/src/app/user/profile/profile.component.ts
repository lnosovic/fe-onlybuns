import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { User } from '../models/user.model';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user:User |null = null;
  followingUser: User[] = [];
  userId: number | null = null;
  constructor(private http:HttpClient,private router:ActivatedRoute){}
  ngOnInit(): void {
    this.userId = Number(this.router.snapshot.paramMap.get('id'));
    this.loadUser(this.userId);
  }
  loadUser(userId:number){
    this.http.get<User>(`http://localhost:8080/api/users/profile/${userId}`).subscribe({
      next:(user)=>{
        this.user=user;
      },
      error: (err) => console.error('Error fetching user:',err)
    });
  }
}
