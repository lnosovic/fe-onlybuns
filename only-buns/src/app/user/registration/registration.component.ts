import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms'
import { Location } from '../../post/models/location.model';
import { Registration } from '../models/registration.model';
import { Router } from '@angular/router';
import { HttpClient,HttpHeaders } from '@angular/common/http';
@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent implements OnInit {
  confirmPassword: any|null=null;
  registrationForm = new FormGroup({
    name: new FormControl('',Validators.required),
    surname: new FormControl('',Validators.required),
    username: new FormControl('',Validators.required),
    email: new FormControl('',[Validators.required,Validators.email]),
    password: new FormControl('',Validators.required),
    confirmPassword: new FormControl('', Validators.required), 
  }) 
  constructor(private router:Router,private http:HttpClient){}
  ngOnInit(): void {
    
  }
  registerUser():void{
    if(this.registrationForm.valid && this.checkPassword()){
      const location:Location={
        id:0,
        longitude:20,
        latitude:45,
        country:'Serbia',
        city:'Novi Sad',
      }
      const user: Registration={
        id:0,
        username:this.registrationForm.value.username!,
        password:this.registrationForm.value.password!,
        name:this.registrationForm.value.name!,
        surname:this.registrationForm.value.surname!,
        email:this.registrationForm.value.email!,
        location:location,
        isActivated:false
      };
      const signupHeaders = new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });
      this.http.post<Registration>('http://localhost:8080/auth/signup',JSON.stringify(user),{headers:signupHeaders}).subscribe({
        next:()=>{
          this.resetForm();
        },
        error: (err) => console.error('Error during registration:',err)
      });
    }
  }
  checkPassword():boolean{
    const password = this.registrationForm.get('password')?.value;
    const confirmPassword = this.registrationForm.get('confirmPassword')?.value;

    return password === confirmPassword;
  }
  resetForm():void{
    this.registrationForm.reset();
  }
}
