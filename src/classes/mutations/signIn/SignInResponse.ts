import { StatusCode } from "../../Status";
import UserRecord from "./UserRecord";

export default class SignInResponse 
{
    public  statusCode:     StatusCode;
    public  user:           UserRecord;
    public  elapsedTime:    number;

    constructor()
    {
        this.statusCode     =   null; 
        this.user           =   null;
    }
}