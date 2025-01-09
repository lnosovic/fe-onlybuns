import { Component, OnInit } from '@angular/core';
import { Post } from '../models/post.model';
// import { PostService } from '../post.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { User } from '../../user/models/user.model';
import { Router } from '@angular/router';
@Component({
  selector: 'app-posts-preview',
  standalone: true,
  imports:[CommonModule],
  templateUrl: './posts-preview.component.html',
  styleUrl: './posts-preview.component.css'
})
export class PostsPreviewComponent implements OnInit{
  posts: Post[]=[];
  usernames: {[userId:number]:string}={};
  showComments=false;
  selectedPost: any = null;
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
  constructor(private http:HttpClient,private router:Router){}
  ngOnInit(): void {
    this.loadPosts();
    if (typeof window !== 'undefined' && window.localStorage) {
          const token = localStorage.getItem("jwt") || '';
          const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`, // Add Bearer token
            'Accept': 'application/json',
          });
      
          if (token) {
            this.http.get<User>('http://localhost:8080/api/users/userInfo', { headers }).subscribe({
              next: (res) => {
                this.currentUser= res;
              },
            });
          }
        }
  }
  loadPosts(){
    this.http.get<Post[]>('http://localhost:8080/api/posts').subscribe({
      next:(posts)=> {
          this.posts=posts;
          this.posts.forEach(post=>this.fetchUsername(post.userId));
          console.log(1)

      },
      error: (err) => console.error('Error fetching posts:', err),
    });
  }
  fetchUsername(userId:number){
    this.http.get<User>(`http://localhost:8080/api/users/profile/${userId}`).subscribe({
      next:(user)=>{
        this.usernames[userId] = user.username;
      },
      error: (err) => console.error('Error fetching user:',err)
    });
  }
  viewProfile(userId:number){
    this.router.navigate(['profile',userId])
  }
  openComments(post:Post){
    this.selectedPost=post;
    this.showComments=true;
  }
  closeComments(post:Post){
    this.selectedPost=null;
    this.showComments=false;
  }
  addComment(){
    if(this.currentUser.role.name==='ROLE_USER' || this.currentUser.role.name==='ROLE_ADMIN'){
      alert('radi');
    }else{
      alert('You must login');
    }
  }
}
