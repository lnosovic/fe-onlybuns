import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { User } from '../../user/models/user.model';
import { HttpClient, HttpHeaderResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';


export interface UserSearchCriteria {
  username?: string;
  name?: string;
  surname?: string;
  email?: string;
  address?: string;

  minPostCount?: number | null;
  maxPostCount?: number | null;

  sortBy?: string;
  sortDirection?: string;

  page?: number;
  size?: number;
}



@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})

export class AdminUsersComponent implements OnInit{
  criteria: UserSearchCriteria = {
    username: '',
    name: '',
    surname: '',
    email: '',
    address: '',
    minPostCount: null,
    maxPostCount: null,
    sortBy: '',
    sortDirection: '',
    page: 0,
    size: 5
  };

  users: User[] = [];
  totalPages: number = 0;


  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.searchUsers();
  }

  searchUsers(): void {
    let params = new HttpParams();
  
    if (this.criteria.username) {
      params = params.set('username', this.criteria.username);
    }
    if (this.criteria.name) {
      params = params.set('name', this.criteria.name);
    }
    if (this.criteria.surname) {
      params = params.set('surname', this.criteria.surname);
    }
    if (this.criteria.email) {
      params = params.set('email', this.criteria.email);
    }
    if (this.criteria.address) {
      params = params.set('address', this.criteria.address);
    }
    if (this.criteria.minPostCount !== null && this.criteria.minPostCount !== undefined) {
      params = params.set('minPostCount', this.criteria.minPostCount.toString());
    }
    if (this.criteria.maxPostCount !== null && this.criteria.maxPostCount !== undefined) {
      params = params.set('maxPostCount', this.criteria.maxPostCount.toString());
    }
    if (this.criteria.sortBy) {
      params = params.set('sortBy', this.criteria.sortBy);
    }
    if (this.criteria.sortDirection) {
      params = params.set('sortDirection', this.criteria.sortDirection);
    }
  
    // Ova dva su obavezna
    params = params.set('page', (this.criteria.page ?? 0).toString());
    params = params.set('size', (this.criteria.size ?? 5).toString());
  
    //console.log('Query:', params.toString()); // Debug: vidi rezultat
    const token = localStorage.getItem("jwt") || '';
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    });
    this.http
      .get<any>('http://localhost:8080/api/users/search?' + params.toString(), {headers})
      .subscribe({
        next: res => {
          this.users = res.content;
          this.totalPages = res.totalPages;
        },
        error: err => {
          console.error('Greška prilikom pretrage:', err);
          alert('Error while searching, check your parameters and try again');
        }
      });
  }

  changePage(newPage: number) {
    this.criteria.page = newPage;
    this.searchUsers();
  }


}
