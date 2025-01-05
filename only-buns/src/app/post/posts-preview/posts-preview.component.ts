import { Component, OnInit } from '@angular/core';
import { Post } from '../models/post.model';
// import { PostService } from '../post.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-posts-preview',
  standalone: true,
  imports:[CommonModule],
  templateUrl: './posts-preview.component.html',
  styleUrl: './posts-preview.component.css'
})
export class PostsPreviewComponent implements OnInit{
  posts: Post[]=[];
  usernames: []=[];
  constructor(private http:HttpClient){}
  ngOnInit(): void {
    this.loadPosts();
    console.log(1)
  }
  loadPosts(){
    this.http.get<Post[]>('http://localhost:8080/api/posts').subscribe({
      next:(posts)=> {
          this.posts=posts;
          console.log(1)

      },
      error: (err) => console.error('Error fetching posts:', err),
    })
  }
}
