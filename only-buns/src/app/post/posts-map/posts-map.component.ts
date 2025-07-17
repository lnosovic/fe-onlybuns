import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { User } from '../../user/models/user.model';
import { Location } from '../models/location.model';
import { Post } from '../models/post.model';
import { RabbitCare } from '../models/rabbit-care.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Component({
  selector: 'app-posts-map',
  standalone: true,
  imports: [],
  templateUrl: './posts-map.component.html',
  styleUrl: './posts-map.component.css'
})
export class PostsMapComponent implements AfterViewInit {
private map: any;
posts:Post[]=[];
rabbitCares:RabbitCare[]=[];
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
  constructor(private router:Router,private http:HttpClient){}

  private initMap(): void {
    this.map = L.map('map', {
      center: [this.currentUser.location.latitude,this.currentUser.location.longitude,],
      zoom: 13,
    });

    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );
    tiles.addTo(this.map);
  }

  ngAfterViewInit(): void {
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
            this.loadPosts();
            this.initMap();
            this.loadRabbitCareLocations();
          },
          error: (err) => console.error('Error fetching user:', err)
        });
      }
    }
  }
    loadPosts(){
    const radius = 100.0; 
    const lat = this.currentUser.location.latitude;
    const lon = this.currentUser.location.longitude;
    let token = '';
    if (typeof window !== 'undefined' && localStorage) {
      token = localStorage.getItem("jwt") || '';
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    });
    this.http.get<Post[]>('http://localhost:8080/api/posts/nearby',{ params:{lat: lat.toString(),lon:lon.toString(),radius:radius.toString()}, headers}).subscribe({
      next:(posts)=> {
          this.posts=posts;
          this.posts.forEach(post => {
          if(post.userId !== this.currentUser.id){
            this.fetchUsername(post.userId).subscribe(username => {
              this.addMarkerWithImage(post.location.latitude, post.location.longitude, post.image,username,post.description,post.location,post.userId);
            });
          } // prikaz objava drugih korinika
            console.log(post.image)
        });
          console.log(1)

      },
      error: (err) => console.error('Error fetching posts:', err),
    });
  }
  private addMarkerWithImage(lat: number, lng: number, image: string, username: string,description:string,location:Location,userId:number): void {
 const icon = L.divIcon({
    className: '',
    html: `
      <div class="flex flex-col items-center">
        <div class="avatar">
          <div class="w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
            <img src="${image}" />
          </div>
        </div>
        <span class="text-sm font-medium mt-1 text-black">${username}</span>
      </div>
    `
  });
  const marker = L.marker([lat, lng], { icon }).addTo(this.map);

 const popupContent = `
    <div class="bg-white rounded-xl shadow-md overflow-hidden w-72 text-black">
      <figure class="w-full h-40 overflow-hidden">
        <img src="${image}" alt="Post image" class="w-full h-full object-cover" />
      </figure>
      <div class="p-4 text-center">
        <h2 class="text-lg font-bold text-primary cursor-pointer username-click">
          @${username}
        </h2>
        <p class="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          ${location.city}, ${location.country}
        </p>
        <p class="text-sm mt-2">${description}</p>
      </div>
    </div>
  `;
  marker.bindPopup(popupContent);

  // Dodaj event listener kad se popup otvori
  marker.on('popupopen', () => {
    const element = document.querySelector('.username-click');
    if (element) {
      element.addEventListener('click', () => {
          this.viewProfile(userId);
      });
    }
  });
  }
  fetchUsername(userId: number): Observable<string> {
  return this.http.get<User>(`http://localhost:8080/api/users/profile/${userId}`)
    .pipe(map(user => user.username));
  }
  viewProfile(userId:number){
    this.router.navigate(['profile',userId])
    //console.log('plaki')
    
  }
  loadRabbitCareLocations() {
    const token = localStorage.getItem("jwt") || '';
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    });

    this.http.get<RabbitCare[]>('http://localhost:8080/api/rabbitCare', { headers }).subscribe({
      next: (rabbitCares) => {
        this.rabbitCares = rabbitCares;
        this.rabbitCares.forEach(care => {
          console.log(care);
          this.addRabbitCareMarker(care);
        });
      },
      error: (err) => console.error('Error fetching rabbit care locations:', err),
    });
  }
  private addRabbitCareMarker(care: RabbitCare): void {
    const icon = L.divIcon({
      className: '',
      html: `
        <div class="flex flex-col items-center">
          <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center r text-white text-2xl font-bold">
            🏥
          </div>
          <span class="text-xs font-semibold text-black mt-1">${care.name}</span>
        </div>
      `
    });

    const marker = L.marker([care.latitude, care.longitude], { icon }).addTo(this.map);

    const popupContent = `
      <div class="bg-white rounded-xl shadow-md overflow-hidden w-60 text-black p-3">
        <h2 class="text-lg font-bold text-green-700 mb-1">${care.name}</h2>
        <p class="text-sm text-gray-500">
          📍 ${care.city}, ${care.country}
        </p>
      </div>
    `;

    marker.bindPopup(popupContent);
  }
}
