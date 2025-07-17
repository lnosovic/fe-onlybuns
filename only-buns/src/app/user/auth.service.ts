// src/app/user/auth.service.ts

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode'; // Instaliraćemo ovu biblioteku

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router) { }

  private getToken(): string | null {
    // Proveri da li se kod izvršava u browseru (za SSR)
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('jwt');
    }
    return null;
  }

  // Metoda za čuvanje tokena (koristiće se u LoginComponent)
  public saveToken(token: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('jwt', token);
    }
  }

  // Metoda za brisanje tokena (za odjavu)
  public logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('jwt');
    }
    this.router.navigate(['/login']); // Preusmeri na login stranicu nakon odjave
  }

  // Provera da li je korisnik prijavljen (da li token postoji)
  public isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token); // Proveri da li token postoji i da nije istekao
  }

  // Metoda za parsiranje tokena i dobijanje korisničkih informacija
  public getUserInfo(): any | null {
    const token = this.getToken();
    if (token) {
      try {
        // jwt_decode biblioteka će dekodirati payload tokena
        const decodedToken: any = jwtDecode(token);
        return decodedToken;
      } catch (Error) {
        console.error('Error decoding JWT token:', Error);
        return null;
      }
    }
    return null;
  }

  // Metoda za proveru uloge administratora
  public isAdmin(): boolean {
    const userInfo = this.getUserInfo();
    if (userInfo && userInfo.role) { // Pretpostavljam da JWT token ima 'role' polje
      // Spring Security često vrati ulogu u formatu 'ROLE_ADMIN', 'ROLE_USER' itd.
      // Tvoja uloga admina bi trebalo da bude ROLE_ADMIN
      //console.log("auth.service.ts/isAdmin: user role:", userInfo.role);
      return userInfo.role === 'ROLE_ADMIN'; // Ili whatever your admin role is in the token
    }
    return false;
  }

  // Pomoćna metoda za proveru isteka tokena
  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.exp === undefined) {
        return false; // Token nema 'exp' (expiration) polje
      }
      const currentTime = Math.floor(Date.now() / 1000); // Trenutno vreme u sekundama
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // U slučaju greške, smatraj token isteklim
    }
  }
}