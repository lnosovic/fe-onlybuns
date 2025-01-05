import {Role} from "./role" 
export interface User{
    id:number;
    username: string;
    name: string;
    surname: string;
    email: string;
    role: Role;
    postCount: number;
    followerCount:number;
    followingCount:number;

}