import {Location} from "./location.model";
import { Comment } from "./comment.model";
export interface Post{
    id: number;
    userId:number;
    description:string;
    image: string;
    location:Location;
    likes:number;
    comments:Comment[];
    
}