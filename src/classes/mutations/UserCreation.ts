import { ObjectId } from "mongodb";

interface UserCreationArgs 
{
    login:    string;
    password: string;
}

class UserRecord 
{
    _id:            ObjectId
    Login:          string;
    Password:       string;
    CreationDate:   Date;
    LastUpdateDate: Date;
    IsLogged:       boolean;
    LastLoginDate:  Date;

    constructor (login: string, pwd: string)
    {
        
        this.Login      = login;
        this.Password   = pwd;

        const now = new Date();
        
        this._id            = new ObjectId ();
        this.CreationDate   = now;
        this.LastLoginDate  = now;
        this.LastLoginDate  = now;
        this.IsLogged       = true;
    }
}

class UserCreationResponse
{
    Success: boolean    = false;
    Error:   string     = "";
}

export 
{
    UserCreationResponse, 
    UserCreationArgs,
    UserRecord
}