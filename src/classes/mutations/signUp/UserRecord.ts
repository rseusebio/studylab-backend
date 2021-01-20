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
    lastUpdateDate:  Date;
    lastLoginDate:   Date;
    lastLogOutDate:  Date;

    isLogged:       boolean;
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
        const delta =  Date.now( ) - this._creationDate.valueOf( );
        
        // milliseconds in a day
        const conversionRate = 1000 * 60 * 60 * 24; 

        const accountDays = Math.round( delta / conversionRate );

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
        this.lastLoginDate   =    now;
        this.lastUpdateDate  =    now;
        this.lastLogOutDate  =    null;

        this.emailStatus    =    EmailStatus.Pending;
        this.accountStatus  =    AccountStatus.Active;
    }
}

export {
    AccountStatus, 
    EmailStatus
}