import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-activate-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activate-user.component.html',
  styleUrl: './activate-user.component.css'
})
export class ActivateUserComponent implements OnInit {
  userId: number | null = null;
  constructor(private http:HttpClient,private router:ActivatedRoute){}
  ngOnInit(): void {
    this.userId = Number(this.router.snapshot.paramMap.get('id'));
  }
  userActivation():void{
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
    if(this.userId!==null){
      this.http.put<any>(`http://localhost:8080/auth/activate/${this.userId}`,{headers}).subscribe({
        next:()=>{
          alert('User successfully activated');
        },
        error: (err) => console.error('Error activating user:',err)
      });
    }
  }
}
