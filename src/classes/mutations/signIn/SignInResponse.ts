import { StatusCode } from "../../Status";
import UserRecord from "./UserRecord";

export default class SignInResponse 
{
    public  succeeded:      boolean;
    public  statusCode:     StatusCode;
    public  user:           UserRecord;
    public elapsedTime:     number;

    constructor()
    {
        this.succeeded  = false;
        this.statusCode = null; 
    }
}