import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutModule } from "./layout/layout.module";
import { NavbarComponent } from './layout/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    RouterOutlet,
    LayoutModule,
    NavbarComponent,
]
})
export class AppComponent {
  title = 'only-buns';
}
