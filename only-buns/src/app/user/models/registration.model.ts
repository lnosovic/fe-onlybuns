import { Location } from "../../post/models/location.model";

export interface Registration{
    id:number;
    username:string;
    password:string;
    name:string;
    surname:string;
    email:string;
    location:Location;
    isActivated:boolean;
}