import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { User } from '../../user/models/user.model';
import { Post } from '../models/post.model';
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
          },
          error: (err) => console.error('Error fetching user:', err)
        });
      }
    }
  }
    loadPosts(){
    this.http.get<Post[]>('http://localhost:8080/api/posts').subscribe({
      next:(posts)=> {
          this.posts=posts;
          this.posts.forEach(post => {
          if(post.userId !== this.currentUser.id){
            this.fetchUsername(post.userId).subscribe(username => {
              this.addMarkerWithImage(post.location.latitude, post.location.longitude, post.image,username,post.description); 
            });
          } // prikaz objava drugih korinika
            console.log(post.image)
        });
          console.log(1)

      },
      error: (err) => console.error('Error fetching posts:', err),
    });
  }
  private addMarkerWithImage(lat: number, lng: number, image: string, username: string,description:string): void {
    const icon = L.divIcon({
      className: '',
      html: `
        <div style="text-align: center;">
          <img src="${image}" style="width: 40px; height: 40px;" />
          <div style="font-size: 14px; color: black; margin-top: 4px;">${username}</div>
        </div>
    `
    });
  const marker = L.marker([lat, lng], { icon }).addTo(this.map);

   marker.bindTooltip(
    `<div style="text-align:center;">
       <img src="${image}" style="width:220px;height:220px;border-radius:8px;margin-bottom:5px;" />
       <br />
       <strong>${username}</strong><br/>
       ${description}
     </div>`,
    {
      direction: 'top',
      offset: [0, -50],
      opacity: 0.9,
      sticky: true,
      className: 'custom-tooltip'
    }
  );

  }
  fetchUsername(userId: number): Observable<string> {
  return this.http.get<User>(`http://localhost:8080/api/users/profile/${userId}`)
    .pipe(map(user => user.username));
}
}
