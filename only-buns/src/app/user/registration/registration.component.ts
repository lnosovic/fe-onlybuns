import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms'
import { Location } from '../../post/models/location.model';
import { Registration } from '../models/registration.model';
import { Router } from '@angular/router';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { MapComponent } from '../../layout/map/map.component'; 

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,MapComponent],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent implements OnInit {
  confirmPassword: any|null=null;
  SelectedLocation: Location | null = null;
  mapResetTrigger: boolean = false; 
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
      if (!this.SelectedLocation) {
        alert('Please select your location on the map.');
        return;
      }
       const location: Location = {
          id: 0,
          longitude: this.SelectedLocation.longitude,
          latitude: this.SelectedLocation.latitude,
          country: this.SelectedLocation.country,
          city: this.SelectedLocation.city
      };
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
          this.SelectedLocation = null;
          this.mapResetTrigger = true;
          setTimeout(() => this.mapResetTrigger = false, 0);
        },
        error: (err) => {
          if (err.status === 409 && err.error) {
            alert('Registration failed: ' + err.error); // prikazuje npr. "Username already exists"
          } else {
            console.error('Error during registration:', err);
            alert('Unexpected error occurred during registration.');
          }
        }
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
  onLocationSelected(location: Location): void {
  console.log('Received location from map:', location);
  this.SelectedLocation = location;
}
}
