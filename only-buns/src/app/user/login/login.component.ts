import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit{
  private access_token = null;
  loginForm = new FormGroup({
    username: new FormControl('',Validators.required),
    password: new FormControl('',Validators.required)
  })

  constructor(private router:Router,private http:HttpClient){}

  ngOnInit(): void {
    
  }
  login():void{
    if(this.loginForm.valid){
      const login = this.loginForm.value;
      const loginHeaders = new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });
      const body = {
        'username': this.loginForm.value.username,
        'password': this.loginForm.value.password
      };
      this.http.post<any>(`http://localhost:8080/auth/login`,body,{headers: loginHeaders        
      }).pipe(map((res)=>{
        this.access_token=res.accessToken;
        console.log('dobroje'+ res.accessToken)
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('jwt', res.accessToken);
        }
        console.log(this.access_token)
      })).subscribe({
        next:()=>{
          console.log('Login successful');
          this.router.navigate(['home']);
        },
        error: (err) => {
          console.error('Error fetching user:',err);
          alert('Invalid username or password');
        }
      })
    }
  }
  signUp(){
    this.router.navigate(["sign-up"]);
  }
  
}
