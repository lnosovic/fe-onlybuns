// src/app/user/auth/admin.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs'; // Omogućava asinhroni rad, iako ga ovde ne koristimo direktno
import { AuthService } from '../auth.service'; // Uvezi tvoj AuthService

@Injectable({
  providedIn: 'root' // Omogućava da se Guard automatski "ubrizga"
})
export class AdminGuard implements CanActivate { // Definišemo Guard kao klasu

  // Konstruktor za ubrizgavanje AuthService i Router servisa
  constructor(private authService: AuthService, private router: Router) {}

  // Metoda koja se poziva kada se pokuša aktivacija rute
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // 1. Proveravamo da li je korisnik uopšte prijavljen (da li ima validan token)
    if (this.authService.isAuthenticated()) {
      // 2. Ako je prijavljen, proveravamo da li je administrator
      if (this.authService.isAdmin()) {
        console.log('AdminGuard: Korisnik je administrator. Dozvoljen pristup.');
        return true; // Dozvoli pristup ruti
      } else {
        // Korisnik je prijavljen, ali NEMA ADMIN ULOGU
        console.warn('AdminGuard: Korisnik je prijavljen, ali NEMA ADMIN PRIVILEGIJE. Preusmeravanje na /home.');
        this.router.navigate(['/home']); // Preusmeri na 'home' stranicu
        return false; // Zabranjuje pristup
      }
    } else {
      // Korisnik NIJE prijavljen (nema token ili je istekao)
      console.warn('AdminGuard: Korisnik NIJE prijavljen. Preusmeravanje na /login.');
      this.router.navigate(['/login']); // Preusmeri na login stranicu
      return false; // Zabranjuje pristup
    }
  }
}