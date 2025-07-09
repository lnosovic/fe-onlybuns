import { Component, OnInit } from '@angular/core';
import { Post } from '../models/post.model'; // Proveri putanju do tvog Post modela!
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { User } from '../../user/models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../post.service'; // PostService je sada ispravno uvezen
import { Observable, of } from 'rxjs'; // Dodaj 'of'
import { tap, catchError, switchMap } from 'rxjs/operators'; // Dodaj 'tap', 'catchError', 'switchMap'

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

  // Konstruktor injektuje potrebne servise
  constructor(private route: ActivatedRoute, private http:HttpClient, private router: Router, private postService: PostService){
  }

  ngOnInit(): void {
    // Lančano učitavanje: prvo postovi, pa korisnik, pa provera lajkova
    this.loadPosts().pipe(
      // Kada se loadPosts() završi i emituje postove, switchMap prebacuje na novi Observable
      // u ovom slučaju, Observable koji vraća loadCurrentUser()
      switchMap(() => this.loadCurrentUser())
    ).subscribe({
      next: () => {
        // Ovaj 'next' blok se poziva tek kada se OBA Observables (posts i currentUser) završe
        // I postovi i currentUser su sada dostupni i postavljeni na 'this.'
        this.checkInitialLikeStatus();
      },
      error: (err) => {
        // Uhvati bilo koju grešku iz lanca (loadPosts ili loadCurrentUser)
        console.error('Greška tokom inicijalnog učitavanja postova ili korisnika:', err);
        // I dalje probaj da proveriš lajkove, čak i ako nešto nije uspelo (biće false)
        this.checkInitialLikeStatus();
      }
    });
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
}
