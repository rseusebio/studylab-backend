import { ObjectId } from "mongodb";

enum AccountStatus
{
    Active = 0, 
    Inactive, 
}

enum EmailStatus
{
    Verified = 0, 
    Invalid,
    Pending
}

export default class UserRecord 
{
    _id:            ObjectId;
    username:       string;
    email:          string;
    password:       string;

    _creationDate:   Date;
    lastUpdateDate: Date;
    lastLoginDate:  Date;

    isLogged:       boolean;
    enabled:        boolean;
    emailStatus:    EmailStatus;
    accountStatus:  AccountStatus;

    public get id( )
    {
        return this._id.toHexString( );
    }

    public get creationDate( )
    {
        return this._creationDate.toISOString( );
    }

    public get accountDays( )
    {
        const accountDays = Math.round( ( Date.now( ) - this._creationDate.valueOf( ) ) / 1000 / 60 / 60 / 24 );

        return accountDays;

    }
    
    constructor( username: string, email: string, pwd: string )
    {
        const now = new Date();

        this._id            =    new ObjectId ();

        this.username       =    username;
        this.email          =    email;
        this.password       =    pwd;
        
        this._creationDate   =    now;
        this.lastLoginDate  =    now;
        this.lastLoginDate  =    now;

        this.isLogged       =    true;
        this.enabled        =    true;

        this.emailStatus    =    EmailStatus.Pending;
        this.accountStatus  =    AccountStatus.Active;
    }


}

export {
    AccountStatus, 
    EmailStatus
}