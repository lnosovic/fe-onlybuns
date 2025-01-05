import {Location} from "./location.model"
export interface Post{
    id: number;
    userId:number;
    description:string;
    image: string;
    location:Location;
    likes:number;
    
}