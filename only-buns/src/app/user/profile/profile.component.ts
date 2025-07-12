import { CommonModule } from '@angular/common';
import { Component, OnInit, provideExperimentalCheckNoChangesForDebug } from '@angular/core';
import { User } from '../models/user.model';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Post } from '../../post/models/post.model';
import { PostService } from '../../post/post.service';
import { ChatService } from '../../chat/chat.service';
import { firstValueFrom } from 'rxjs';

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
  
  constructor(private http:HttpClient,private activeRouter:ActivatedRoute,private router:Router, private postService: PostService, private chatService: ChatService){}
  ngOnInit(): void {
    this.activeRouter.params.subscribe(async params => {

        try{
          this.userId = +params['id'];
          this.loadUserInfo(this.userId); 
          this.loadUserPosts(this.userId).then(() => {
            this.loadCurrentUser().then(() => {
              this.checkInitialLikeStatus();
            })
          });
          this.loadUserFollowers(this.userId);
          this.loadUserFollowing(this.userId);
          //this.checkInitialLikeStatus();
          this.showFollowers=false;
          this.showFollowings=false;
        }catch{

        }


    });
  }


  loadUserInfo(userId:number){
    this.http.get<User>(`http://localhost:8080/api/users/profile/${userId}`).subscribe({
      next:(user)=>{
        this.userProfile=user;
      },
      error: (err) => console.error('Error fetching user:',err)
    });
  }
  async loadUserPosts(userId:number): Promise<void>{
   //console.log('loading user posts');
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem("jwt");
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      });
      // this.http.get<Post[]>(`http://localhost:8080/api/posts/getAllUserPosts/${userId}`,{headers}).subscribe({
      //   next:(posts)=>{
      //     //console.log(posts);
      //     this.posts=posts;
      //     console.log(this.posts);
      //     return;
      //   }
      // })
      const posts = await firstValueFrom(
        this.http.get<Post[]>(`http://localhost:8080/api/posts/getAllUserPosts/${userId}`, { headers })
      );
      this.posts = posts;
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
  async loadCurrentUser():Promise<void>{
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem("jwt") || '';
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      });
      if(token){
        const currentUser = await firstValueFrom(this.http.get<User>('http://localhost:8080/api/users/userInfo', { headers }));
        this.currentUser = currentUser;
      }
    }
  }
  viewProfile(userId:number){
    this.router.navigate(['profile',userId])
    this.isPostModalOpen=false;
    //console.log('plaki')
    
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

    this.http.post(`http://localhost:8080/api/users/${this.userProfile.id}/follow`, {}, { headers, responseType: 'text' as const }).subscribe({
      next: (response) => {
        if (this.userProfile) {
          this.userProfile.followerCount = this.userProfile.followerCount + 1;
          console.log('Odgovor sa servera:', response);
        }
      },
      error: (err) => {
        console.error('Greška pri praćenju korisnika:', err);
        //alert('Došlo je do greške prilikom praćenja.');
      }
    });
    if (this.currentUser && this.userProfile) {
      this.followers.push(this.currentUser); // ili ceo user ako imaš
    }
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
        if (this.currentUser && this.userProfile) {
          this.followers = this.followers.filter((u:any) => u.id !== this.currentUser.id);
          this.checkFollowingStatus();
        }
      },
      error: (err) => {
        console.error('Greška pri prekidu praćenja korisnika:', err);
        alert('Došlo je do greške prilikom prekida praćenja.');
      }
    });
  }

  onBackdropClick(event: MouseEvent, type: 'followings' | 'followers') {
    const target = event.target as HTMLElement;
  
    // Kliknut je direktno backdrop (a ne unutrašnji .modal-box)
    if (target.classList.contains('modal')) {
      if (type === 'followings') this.closeFollowings();
      else if (type === 'followers') this.closeFollowers();
    }
  }
  isMyProfile(){
    if(this.currentUser){
      if(this.currentUser.id === this.userProfile?.id){
        return true;
      }
    }
    return false;
  }

  createPersonalChat(): void {
    if (!this.userProfile || !this.userProfile.id) {
      console.error('Greška: ID korisničkog profila nije dostupan.');
      // Možeš prikazati poruku korisniku (npr. toast notifikaciju)
      return;
    }

    // ID korisnika sa kojim želimo da kreiramo chat je userProfile.id
    const otherUserId = this.userProfile.id;

    console.log(`Pokušavam da kreiram personalni chat sa korisnikom ID: ${otherUserId}`);

    this.chatService.createPersonalChat(otherUserId).subscribe({
      next: (chatRoom) => {
        console.log('Uspešno kreirana personalna chat soba:', chatRoom);
        // Ovde možeš dodati logiku nakon uspešnog kreiranja chat sobe:
        // 1. Preusmeri korisnika na stranicu sa tom chat sobom.
        //    this.router.navigate(['/chat', chatRoom.id]);
        // 2. Ažuriraj UI da prikaže da je chat soba kreirana.
        // 3. Prikazati neku "uspešnu" poruku korisniku.
      },
      error: (error) => {
        console.error('Greška pri kreiranju personalne chat sobe:', error);
        // Ovde možeš dodati logiku za prikaz greške korisniku:
        // Npr. prikazati poruku "Nije moguće kreirati chat sobu".
        alert(`Greška: ${error.message || 'Nije moguće kreirati chat sobu.'}`);
      }
    });
  }

  async checkInitialLikeStatus(): Promise<void> {
    // if (!this.currentUser || this.currentUser.id === 0) { // Ako currentUser nije učitan ili je ID 0, preskoči
    //     console.warn("Korisnik nije ulogovan ili currentUser.id je 0. Ne mogu proveriti status lajkova.");
    //     // Postavi sve na false po defaultu ako korisnik nije ulogovan
    //     this.posts.forEach(post => post.isLikedByUser = false);
    //     return;
    // }
    //console.log('checking initial like status');
    this.posts.forEach(post => {
      //console.log(post);
      this.postService.isPostLikedByUser(post.id).subscribe({
        next: (isLiked: boolean) => {
          post.isLikedByUser = isLiked;
          //console.log(post.id, post.isLikedByUser);
        },
        error: (error: Error) => {
          // Rukovanje greškama kada je isPostLikedByUser bez pipe()
          console.error(`Greška pri proveri lajka za post ${post.id} u komponenti:`, error);
          if (error instanceof HttpErrorResponse && error.status === 404) {
            post.isLikedByUser = false; // Post ili korisnik nisu pronađeni, smatraj da nije lajkovano
          } else {
            post.isLikedByUser = false; // Za ostale greške, takođe smatraj da nije lajkovano
          }
        }
      });
    });
  }






}
