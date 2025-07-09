import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { User } from '../models/user.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Post } from '../../post/models/post.model';
import { PostService } from '../../post/post.service';

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
  showComments=false;
  isHoveringUnfollow = false;
  
  constructor(private http:HttpClient,private activeRouter:ActivatedRoute,private router:Router, private postService: PostService){}
  ngOnInit(): void {
    this.activeRouter.params.subscribe(async params => {

        try{
          this.userId = +params['id'];
          this.loadUserInfo(this.userId); 
          this.loadUserPosts(this.userId);
          this.loadUserFollowers(this.userId);
          this.loadUserFollowing(this.userId);
          this.showFollowers=false;
          this.showFollowings=false;
        }catch{

        }


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
  toggleLike(post: Post): void {
    // Proveri da li je korisnik ulogovan pre nego što pokuša da lajkuje/dislajkuje
    if (!this.currentUser || this.currentUser.id === 0 || (this.currentUser.role.name !== 'ROLE_USER' && this.currentUser.role.name !== 'ROLE_ADMIN')) {
        alert('Morate biti ulogovani da biste lajkovali objave!');
        this.router.navigate(['/login']); // Preusmeri na login
        return;
    }

    if (post.isLikedByUser) {
      // Ako je već lajkovano, dislajkuj
      this.postService.unlikePost(post.id).subscribe({
        next: () => {
          post.isLikedByUser = false; // Ažuriraj UI
          post.likes--; // Smanji broj lajkova na UI
          console.log(`Dislajkovao post ${post.id}`);
        },
        error: (err: Error) => {
          console.error(`Greška pri dislajkovanju posta ${post.id}:`, err);
          alert('Došlo je do greške prilikom dislajkovanja.');
        }
      });
    } else {
      // Ako nije lajkovano, lajkuj
      this.postService.likePost(post.id).subscribe({
        next: () => {
          post.isLikedByUser = true; // Ažuriraj UI
          post.likes++; // Povećaj broj lajkova na UI
          console.log(`Lajkovao post ${post.id}`);
        },
        error: (err: Error) => {
          console.error(`Greška pri lajkovanju posta ${post.id}:`, err);
          alert('Došlo je do greške prilikom lajkovanja.');
        }
      });
    }
  }
  toggleComments(post: any) {
    if (this.showComments && this.selectedPost === post) {
      // Ako su komentari već otvoreni za ovu objavu, zatvori ih
      this.showComments = false;
      this.selectedPost = null;
    } else {
      // Inače, otvori komentare za ovu objavu
      this.showComments = true;
      this.selectedPost = post;
    }
  }
  closeComments(post:Post){
    this.selectedPost=null;
    this.showComments=false;
  }

  checkFollowingStatus(): boolean {
    if (this.currentUser && this.currentUser.id !== 0 && this.userProfile && this.userProfile.id !== 0 && this.currentUser.id !== this.userProfile.id) {
      return this.followers.some(follower => follower.id === this.currentUser!.id);
    } else {
      return false;
    }
  }

  followUser(): void {
    if (!this.userProfile || this.userProfile.id === null || this.userProfile.id === 0) return;
    if (!this.currentUser || this.currentUser.id === null || this.currentUser.id === 0) {
      alert('Morate biti ulogovani da biste pratili korisnike.');
      this.router.navigate(['/login']);
      return;
    }
    if (this.currentUser.id === this.userProfile.id) {
      alert('Ne možete pratiti samog sebe.');
      return;
    }

    const token = localStorage.getItem("jwt") || '';
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    });

    this.http.post(`http://localhost:8080/api/users/${this.userProfile.id}/follow`, {}, { headers }).subscribe({
      next: () => {
        // if (this.userProfile) {
        //   this.userProfile.followerCount = (this.userProfile.followerCount || 0) + 1;
        // }
        // console.log(`Uspešno praćenje korisnika ${this.userProfile?.username}`);
      },
      error: (err) => {
        console.error('Greška pri praćenju korisnika:', err);
        alert('Došlo je do greške prilikom praćenja.');
      }
    });
  }

  unfollowUser(): void {
    if (!this.userProfile || this.userProfile.id === null || this.userProfile.id === 0) return;
    if (!this.currentUser || this.currentUser.id === null || this.currentUser.id === 0) {
      alert('Morate biti ulogovani da biste prekinuli praćenje.');
      this.router.navigate(['/login']);
      return;
    }

    const token = localStorage.getItem("jwt") || '';
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    });

    this.http.delete(`http://localhost:8080/api/users/${this.userProfile.id}/unfollow`, { headers }).subscribe({
      next: () => {
        if (this.userProfile && this.userProfile.followerCount > 0) {
          this.userProfile.followerCount--;
        }
        console.log(`Uspešno prekinuto praćenje korisnika ${this.userProfile?.username}`);
      },
      error: (err) => {
        console.error('Greška pri prekidu praćenja korisnika:', err);
        alert('Došlo je do greške prilikom prekida praćenja.');
      }
    });
  }
}
