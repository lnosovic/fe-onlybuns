import { Component, OnInit } from '@angular/core';
import { Post } from '../models/post.model'; // Proveri putanju do tvog Post modela!
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { User } from '../../user/models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../post.service'; // PostService je sada ispravno uvezen
import { Observable, of } from 'rxjs'; // Dodaj 'of'
import { tap, catchError, switchMap } from 'rxjs/operators'; // Dodaj 'tap', 'catchError', 'switchMap'
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../user/auth.service';

@Component({
  selector: 'app-posts-preview',
  standalone: true,
  imports:[CommonModule, FormsModule],
  templateUrl: './posts-preview.component.html',
  styleUrl: './posts-preview.component.css'
})
  export class PostsPreviewComponent implements OnInit{
    posts: Post[]=[];
    usernames: {[userId:number]:string}={};
    showComments=false;
    selectedPost: any = null;
    currentUser:User | null={
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
  following:User[] = [];

  editingPostId: number | null = null;
  editedDescription: string = '';

  activePostMenu: any = null;

  imageCache = new Map<string, HTMLImageElement>();

  preloadImage(url: string) {
    if (!this.imageCache.has(url)) {
      const img = new Image();
      img.src = url;
      this.imageCache.set(url, img);
    }
  }
  startEditing(post: Post): void {
    this.editingPostId = post.id;
    this.editedDescription = post.description;
  
    // mali delay da textarea postoji u DOM-u pa se tek onda fokusira
    setTimeout(() => {
      const input = document.querySelector('textarea') as HTMLTextAreaElement;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }
  
  submitEdit(post: Post): void {
    const trimmed = this.editedDescription.trim();
    if (trimmed && trimmed !== post.description) {
      this.postService.updateDescription(post.id, trimmed).subscribe({
        next: (updated) => {
          post.description = updated.description;
          this.editingPostId = null;
        },
        error: () => {
          console.error('Failed to update');
          this.editingPostId = null;
        }
      });
    } else {
      this.editingPostId = null;
    }
  }
  togglePostMenu(post: any) {
    this.activePostMenu = this.activePostMenu === post ? null : post;
  }

  editPost(post: Post): void {
    // const newDescription = prompt('Enter new description:', post.description);
    // if (newDescription !== null) {
    //   this.postService.updateDescription(post.id, newDescription).subscribe({
    //     next: (updatedPost) => {
    //       post.description = updatedPost.description; // update local state
    //     },
    //     error: (err) => {
    //       console.error('Failed to update description', err);
    //     }
    //   });
    // }
  }

  postToDelete: Post | null = null;
  deletePost(post: Post): void {
    this.postToDelete = post; // samo otvara modal
  }
  
  confirmDelete(): void {
    if (!this.postToDelete) return;
  
    this.postService.deletePost(this.postToDelete.id).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => p.id !== this.postToDelete!.id);
        this.postToDelete = null;
      },
      error: (err) => {
        console.error('Failed to delete post', err);
        this.postToDelete = null;
      }
    });
  }
  
  cancelDelete(): void {
    this.postToDelete = null;
  }

  // Konstruktor injektuje potrebne servise
  constructor(private route: ActivatedRoute, private http:HttpClient, private router: Router, private postService: PostService, private authService: AuthService){
  }

  ngOnInit(): void {
    this.preloadImage('https://www.protexinvet.com/userfiles/image/cute-2500929_1920_1_light.jpg');

    // Lančano učitavanje: prvo postovi, pa korisnik, pa provera lajkova
    this.loadPosts().pipe(
      // Kada se loadPosts() završi i emituje postove, switchMap prebacuje na novi Observable
      // u ovom slučaju, Observable koji vraća loadCurrentUser()
      switchMap(() => this.loadCurrentUser()),
      switchMap((user) => {
        if (user && user.id && !this.isAdmin()) {
          // Vrati Observable od HTTP zahteva za following korisnike
          return this.loadUserFollowing(user.id);
        }
        // Ako nema usera, samo nastavi dalje sa praznim Observable
        return of([]);
      })
    ).subscribe({
      next: () => {
        // Ovaj 'next' blok se poziva tek kada se OBA Observables (posts i currentUser) završe
        // I postovi i currentUser su sada dostupni i postavljeni na 'this.'

        this.sortPostsByFollowing();
        this.checkInitialLikeStatus();
      },
      error: (err) => {
        // Uhvati bilo koju grešku iz lanca (loadPosts ili loadCurrentUser)
        console.error('Greška tokom inicijalnog učitavanja postova ili korisnika:', err);
        // I dalje probaj da proveriš lajkove, čak i ako nešto nije uspelo (biće false)
        this.sortPostsByFollowing();
        this.checkInitialLikeStatus();
      }
    });
  }

  isAdmin(){
    return this.authService.isAdmin();
  }

  // Modifikovana metoda loadCurrentUser() da vraća Observable
  loadCurrentUser(): Observable<User | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem("jwt") || '';
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      });

      if (token) {
        return this.http.get<User>('http://localhost:8080/api/users/userInfo', { headers }).pipe(
          tap(res => {
            this.currentUser = res; // Ažuriraj this.currentUser
          }),
          catchError(err => {
            console.error('Greška pri dohvatanju informacija o korisniku:', err);
            this.currentUser = null; // Postavi na null ako greška nastane
            return of(null); // Vrati Observable sa null vrednošću
          })
        );
      }
    }
    this.currentUser = null; // Ako nema tokena
    return of(null); // Vrati Observable sa null odmah
  }

  // Modifikovana metoda loadPosts() da vraća Observable
  loadPosts(): Observable<Post[]> {
    return this.http.get<Post[]>('http://localhost:8080/api/posts').pipe(
      tap(posts => {
        this.posts = posts; // Ažuriraj this.posts
        this.posts.forEach(post => this.fetchUsername(post.userId));
        console.log("Postovi učitani.");
      }),
      catchError(err => {
        console.error('Greška pri dohvatanju postova:', err);
        this.posts = []; // Postavi prazan niz u slučaju greške
        return of([]); // Vrati Observable sa praznim nizom
      })
    );
  }

  fetchUsername(userId:number){
    this.http.get<User>(`http://localhost:8080/api/users/profile/${userId}`).subscribe({
      next:(user)=>{
        this.usernames[userId] = user.username;
      },
      error: (err) => console.error('Greška pri dohvatanju korisnika:',err)
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
    if(this.currentUser && (this.currentUser.role.name==='ROLE_USER' || this.currentUser.role.name==='ROLE_ADMIN')){
      alert('radi'); // Ovde ćeš kasnije implementirati poziv backendu za dodavanje komentara
    }else{
      alert('Morate biti ulogovani da biste dodali komentar!');
    }
  }

  checkInitialLikeStatus(): void {
    if (!this.currentUser || this.currentUser.id === 0) { // Ako currentUser nije učitan ili je ID 0, preskoči
        console.warn("Korisnik nije ulogovan ili currentUser.id je 0. Ne mogu proveriti status lajkova.");
        // Postavi sve na false po defaultu ako korisnik nije ulogovan
        this.posts.forEach(post => post.isLikedByUser = false);
        return;
    }

    this.posts.forEach(post => {
      this.postService.isPostLikedByUser(post.id).subscribe({
        next: (isLiked: boolean) => {
          post.isLikedByUser = isLiked;
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

  

  viewPostDetails(postId: number): void {
    // Koristimo router.navigate da odemo na putanju '/post/:id'
    this.router.navigate(['/post', postId]);
  }
  // Nova toggleComments metoda
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

  sortPostsByFollowing() {
    if (!this.following || this.following.length === 0) return;
  
    const followingIds = new Set(this.following.map(u => u.id));
  
    this.posts.sort((a, b) => {
      const aIsFollowing = followingIds.has(a.userId);
      const bIsFollowing = followingIds.has(b.userId);
  
      if (aIsFollowing && !bIsFollowing) return -1; // a ide pre b
      if (!aIsFollowing && bIsFollowing) return 1;  // b ide pre a
      return 0; // ako su oba ili nisu, ostavi redosled
    });
  }
  loadUserFollowing(userId: number): Observable<User[]> {
    return this.http.get<User[]>(`http://localhost:8080/api/users/following/${userId}`).pipe(
      tap(users => this.following = users),
      catchError(err => {
        console.error('Error fetching following users', err);
        this.following = [];
        return of([]);
      })
    );
  }
// Možeš zadržati closeComments metodu ako je koristiš negde drugde,
// ali dugme "Zatvori komentare" sada poziva nju direktno.

}
