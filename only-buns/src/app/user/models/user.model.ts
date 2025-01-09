import { Location } from "../../post/models/location.model";
import {Role} from "./role" 
export interface User{
    id:number;
    username: string;
    name: string;
    surname: string;
    email: string;
    role: Role;
    location: Location;
    postCount: number;
    followerCount:number;
    followingCount:number;

}