import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Post } from '../models/post.model';
import { User } from '../../user/models/user.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { subscribe } from 'diagnostics_channel';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trends',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trends.component.html',
  styleUrl: './trends.component.css'
})
export class TrendsComponent implements OnInit{
  posts:Post[]=[];
  users:User[]=[];
  selectedPost:any=null;
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
  countAllPosts:Number=0;
  countAllPostsThisMonth:Number=0;
  isPostModalOpen :boolean=false;
  showComments:boolean=false;
  usernames: {[userId:number]:string}={};
  activeTab: string = 'top5Posts';
  constructor(private http: HttpClient,private router:Router){}
  ngOnInit(): void {
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
            this.loadNumberAllPosts();
            this.loadNumberAllPostsThisMonth();
          },
          error: (err) => console.error('Error fetching user:', err)
        });
      }
    }
    // this.loadNumberAllPosts();
    // this.loadNumberAllPostsThisMonth();
  }
  loadTop5PostsPast7Days():void{
    let token = '';
    if (typeof window !== 'undefined' && localStorage) {
      token = localStorage.getItem("jwt") || '';
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    });
    this.http.get<Post[]>(`http://localhost:8080/api/posts/mostLikedPostsLast7Days`,{headers}).subscribe({
      next:(posts)=>{
        this.posts = posts;
        this.posts.forEach(post=>this.fetchUsername(post.userId));
      },
      error: (err) => console.error('Error fetching posts:', err)
    })
  }
  loadTop10PostsEver():void{
    let token = '';
    if (typeof window !== 'undefined' && localStorage) {
      token = localStorage.getItem("jwt") || '';
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    });
    this.http.get<Post[]>(`http://localhost:8080/api/posts/top10MostLikedPostsEver`,{headers}).subscribe({
      next:(posts)=>{
        this.posts = posts;
        this.posts.forEach(post=>this.fetchUsername(post.userId));
      },
      error: (err) => console.error('Error fetching posts:', err)
    })
  }
  loadTop10UsersLast7Days():void{
    let token = '';
    if (typeof window !== 'undefined' && localStorage) {
      token = localStorage.getItem("jwt") || '';
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    });
    this.http.get<User[]>(`http://localhost:8080/api/users/top10MostUserLikes`,{headers}).subscribe({
      next:(users)=>{
        this.users = users
      },
      error: (err) => console.error('Error fetching users :', err)
    })
  }
  loadNumberAllPosts():void{
    let token = '';
    if (typeof window !== 'undefined' && localStorage) {
      token = localStorage.getItem("jwt") || '';
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    });
    this.http.get<Number>(`http://localhost:8080/api/posts/countAllPosts`,{headers}).subscribe({
      next:(res)=>{
        console.log(res);
        this.countAllPosts=res;
      },
      error: (err)=>console.error('Error fetching posts:',err)
    })
  }
  loadNumberAllPostsThisMonth():void{
    let token = '';
    token = localStorage.getItem("jwt") || '';
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    });
    console.log(token)
    this.http.get<Number>(`http://localhost:8080/api/posts/countLastMonthPosts`,{headers}).subscribe({
      next:(res)=>{
        this.countAllPostsThisMonth=res;
      },
      error: (err)=>console.error('Error fetching posts:',err)
    })
  }
  fetchUsername(userId:number):void{
    this.http.get<User>(`http://localhost:8080/api/users/profile/${userId}`).subscribe({
      next:(user)=>{
        this.usernames[userId] = user.username;
      },
      error: (err) => console.error('Error fetching user:',err)
    });
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
  openComments(post:Post){
    this.selectedPost=post;
    this.showComments=true;
  }
  closeComments(post:Post){
    this.selectedPost=null;
    this.showComments=false;
  }
  setActiveTab(tag: string): void {
    this.activeTab = tag;
    if(tag === 'top5Posts')
      this.loadTop5PostsPast7Days()
    else if(tag === 'top10Posts')
      this.loadTop10PostsEver()
    else
      this.loadTop10UsersLast7Days();
  }
}
