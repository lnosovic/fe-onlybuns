import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { User } from '../models/user.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Post } from '../../post/models/post.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
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
  userProfile:User |null = null;
  followingUser: User[] = [];
  userId: number | null = null;
  followers:User[] = [];
  following:User[] = [];
  posts: Post[] = [];
  showFollowings:boolean = false;
  showFollowers:boolean = false;
  isPostModalOpen: boolean = false;
  selectedPost:any=null;
  
  constructor(private http:HttpClient,private activeRouter:ActivatedRoute,private router:Router){}
  ngOnInit(): void {
    this.activeRouter.params.subscribe(params => {
      this.userId = +params['id'];
      this.loadUserInfo(this.userId); 
      this.loadUserPosts(this.userId);
      this.loadUserFollowers(this.userId);
      this.loadUserFollowing(this.userId);
      this.showFollowers=false;
      this.showFollowings=false;
    });
    this.loadCurrentUser();
  }
  loadUserInfo(userId:number){
    this.http.get<User>(`http://localhost:8080/api/users/profile/${userId}`).subscribe({
      next:(user)=>{
        this.userProfile=user;
      },
      error: (err) => console.error('Error fetching user:',err)
    });
  }
  loadUserPosts(userId:number):void{
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem("jwt");
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      });
      this.http.get<Post[]>(`http://localhost:8080/api/posts/getAllUserPosts/${userId}`,{headers}).subscribe({
        next:(posts)=>{
          this.posts=posts;
        }
      })
    }
  }
  loadUserFollowers(userId:number){
    
    this.http.get<User[]>(`http://localhost:8080/api/users/followers/${userId}`).subscribe({
      next:(users)=>{
        this.followers=users;
        console.log()
      },
      error:(err)=>console.error('Error fetching followers users',err)
    });
  }
  loadUserFollowing(userId:number){
    this.http.get<User[]>(`http://localhost:8080/api/users/following/${userId}`).subscribe({
      next:(users)=>{
        this.following=users;
      },
      error:(err)=>console.error('Error fetching following users',err)
    });
  }
  openPostModal(post:Post){
    this.selectedPost=post;
    this.isPostModalOpen=true;
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
          },
        });
      }
    }
  }
  viewProfile(userId:number){
    this.router.navigate(['profile',userId])
    this.isPostModalOpen=false;
    console.log('plaki')
    
  }
  addComment(){
    if(this.currentUser.role.name==='ROLE_USER' || this.currentUser.role.name==='ROLE_ADMIN'){
      alert('radi');
    }else{
      alert('You must login');
    }
  }
  closePostModal(){
    this.selectedPost=null;
    this.isPostModalOpen=false;
  }
  openFollowers(){
    this.showFollowings=false;
    this.showFollowers=true;
  }
  openFollowings(){
    this.showFollowings=true;
    this.showFollowers=false;
  }
  closeFollowings(){
    this.showFollowings=false;
  }
  closeFollowers(){
    this.showFollowers=false;
  }
}
