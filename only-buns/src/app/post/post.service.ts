import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from './models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = 'http://localhost:8080/api/posts'; // environment*

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt'); // Ili kako god čuvaš token
    // Proveri da li token postoji. Ako ne, to je greška ili korisnik nije ulogovan.
    if (!token) {
      console.error('JWT Token nije pronađen. Korisnik nije ulogovan ili token nedostaje.');
      // Možeš baciti grešku ili vratiti prazan header, zavisno od tvoje logike autentifikacije.
      return new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  getAllPosts(): Observable<Post[]>{
    return this.http.get<Post[]>('http//localhost:8080/api/posts');
  }

  // Metoda za lajkovanje posta
  likePost(postId: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.post<void>(`${this.apiUrl}/${postId}/like`, {}, { headers });
  }

  // Metoda za dislajkovanje posta
  unlikePost(postId: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${postId}/unlike`, { headers });
  }

  // Metoda za proveru da li je post lajkovan od strane trenutnog korisnika
  isPostLikedByUser(postId: number): Observable<boolean> {
    const headers = this.getAuthHeaders();
    // Observable će emitovati true/false ili će emitovati grešku.
    // Na mestu gde pozivaš ovu metodu (u komponenti), moraš da rukuješ greškom.
    return this.http.get<boolean>(`${this.apiUrl}/${postId}/isLikedByUser`, { headers });
  }

  
  updateDescription(id: number, description: string): Observable<Post> {
    return this.http.patch<Post>(`${this.apiUrl}/${id}`, { description });
  }

  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
