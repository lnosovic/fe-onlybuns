import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { User } from './models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  searchUsersByUsername(username: string): Observable<User[]> {
    const params = new HttpParams()
    .set('username', username)
    .set('size', '5')
    .set('page', '0');

  return this.http.get<any>('http://localhost:8080/api/users/search', { params })
    .pipe(map(res => res.content)); // Uzima samo content iz Page objekta
  }
}