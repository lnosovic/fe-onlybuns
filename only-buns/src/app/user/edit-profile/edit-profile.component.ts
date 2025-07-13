import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms'
import { Router } from '@angular/router';
import { Location } from '../../post/models/location.model';
import { User } from '../models/user.model';
import { AbstractControl, ValidatorFn } from '@angular/forms';
import { MapComponent } from '../../layout/map/map.component';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,MapComponent],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css'
})
export class EditProfileComponent implements OnInit{
  currentUser:User={
    id:0,
    name: '',
    surname: '',
    username: '',
    email: '',
    role: {id:0, name:''},
    location: {id:0,longitude:0,latitude:0,country:'',city:''},
    postCount: 0,
    followerCount: 0,
    followingCount: 0    
  }
 submitted = false;
  confirmPassword: any|null=null;
  SelectedLocation: Location | null = null;
  mapResetTrigger: boolean = false; 
  editForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    surname: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    confirmPassword: new FormControl('', [Validators.required]),
  }, { validators: this.passwordMatchValidator() });
  constructor(private router:Router,private http:HttpClient){}
  ngOnInit(): void {
    this.loadCurrentUser();
  }
  editUser():void{
    this.submitted = true;
    if(this.editForm.valid){
       const updatedUser: any = {
        id: this.currentUser.id,
        name: this.editForm.value.name!,
        surname: this.editForm.value.surname!,
        username: this.currentUser.username,
        email: this.currentUser.email,
        password: this.editForm.value.password!,
        location: {
          id: this.currentUser.location.id,
          latitude: this.SelectedLocation!.latitude,
          longitude: this.SelectedLocation!.longitude,
          city: this.SelectedLocation!.city,
          country: this.SelectedLocation!.country
        }
      };
      const token = localStorage.getItem("jwt");
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      });
      this.http.put(`http://localhost:8080/api/users/${this.currentUser.id}`, updatedUser, { headers}).subscribe({
        next:()=>{
          setTimeout(() => this.mapResetTrigger = false, 0);
          this.logout();
        },
        error: (err) => {
         if (err.error) {
            alert('Unexpected error occurred during edit.');
          }
        }
      });
    }
  }

  get f() { return this.editForm.controls; }
  passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      return { mismatch: true };
    }
    return null;
    };
  }
  onLocationSelected(location: Location): void {
    console.log('Received location from map:', location);
    this.SelectedLocation = location;
  }
  loadCurrentUser():void{
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
            console.log(this.currentUser)
          // Popuni formu sa trenutnim vrednostima korisnika
            this.editForm.patchValue({
              name: res.name,
              surname: res.surname,
            });

            this.SelectedLocation = res.location;            
          },
        });
      }
    }
  }    
   logout(){
    localStorage.removeItem('jwt');
    this.router.navigate(['login']);
  }
}
