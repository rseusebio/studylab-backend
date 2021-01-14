import      { Response, CookieOptions }  from       "express";
import      UserRecord, 
            { AccountStatus, 
              EmailStatus }              from       "./mutations/signIn/UserRecord";
import      { StatusCode      }          from       "./Status";
import      config                       from       "config";
import      AuthConfig                   from       "./config/AuthConfig";
import      DataSources                  from       "../datasources/DataSources";
import      { parseCookie }              from       "../utils/utils";
import      { decrypt, 
              encrypt, 
              hashMessage }              from       "../utils/cryptography";
import      cache                        from       "../cache";

export default class Authorizer 
{
    public statusCode:  StatusCode;

    private user:       UserRecord;
    private cookie:     string;
    private auth:       string | undefined;
    public  username:   string | undefined;
    public  email:      string | undefined;   
    private password:   string | undefined;

     // An internal private field referencing to the user response;
    private res:    Response;

    constructor( cookie: string | undefined, auth: string | undefined, res: Response ) 
    {   
        this.cookie = cookie;
        this.auth   = auth;
        this.res    = res;
    }

    public extractAuth( ): boolean
    {
        if( !this.auth && !this.cookie )
        {
            this.statusCode = StatusCode.EMPTY_CREDENTIAL;

            return false;
        }

        const [ type, credentials ] = this.auth.split( " " );

        if( !type || type.toLowerCase() != "basic" || !credentials )
        {
            this.statusCode = StatusCode.INVALID_CREDENTIAL;

            return false;
        }

        const logInInfo = Buffer.from( credentials, "base64" ).toString( "utf-8" );

        if( !logInInfo )
        {
            this.statusCode = StatusCode.INVALID_CREDENTIAL;
        }

        // this content should be encrypted

        const [ username, pwd ] = logInInfo.split( ":" );

        if ( !username || !pwd )
        {
            this.statusCode = StatusCode.INVALID_CREDENTIAL;

            return false;
        }
        
        const { Keys } = config.get<AuthConfig>( "Authentication" );

        this.username  = username;
        this.password  = hashMessage( pwd, Keys.get( "Auth" ).HashKey );

        return true;
    }

    public validateCookie( ): boolean
    {
        const { CookieName, Keys }  = config.get<AuthConfig>( "Authentication" );

        if ( !this.cookie || this.cookie.search( CookieName + "=" ) < 0 ) 
        {
            this.statusCode = StatusCode.NO_COOKIE_RECEIVED;

            return;
        }

        const jsonCookie = parseCookie( decodeURIComponent( this.cookie ) );

        if( !jsonCookie || !( CookieName in jsonCookie ) )
        {
            this.statusCode = StatusCode.NO_COOKIE_RECEIVED;

            return;
        }

        const { Secret, HashKey } = Keys.get( "Cookie" );

        const cookie = decrypt( jsonCookie[CookieName], Secret, HashKey );

        if( !cookie )
        {
            this.statusCode = StatusCode.INVALID_COOKIE;

            return;
        }

        const [ username, email ] = cookie.split( "::" );

        if( !username || !email )
        {
            this.statusCode = StatusCode.INVALID_COOKIE;

            return;
        }

        this.statusCode =   StatusCode.SUCCEEDED;
        this.username   =   username;
        this.email      =   email;  
        
        return true;
    }

    public generateCookie( username: string, email: string ): string
    {
        const cookie = `${ username }::${ email }::${ new Date( ).toISOString( ) }`;

        const { Keys }  = config.get<AuthConfig>( "Authentication" );

        const { Secret, HashKey } = Keys.get( "Cookie" );

        return encrypt( cookie, Secret, HashKey );
    }

    public setCookie( user: UserRecord ) : void
    {
        const { username, email } = user;

        const { CookieName }  = config.get<AuthConfig>( "Authentication" );

        const cookieOpts: CookieOptions = {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        };
        
        this.res.cookie( CookieName, this.generateCookie( username , email ), cookieOpts );

        this.cacheUser( user );
    }

    public validateUser( user: UserRecord ): boolean
    {
        if ( user.accountStatus != AccountStatus.Active )
        {
            this.statusCode = StatusCode.USER_DISABLED;

            return;
        }

        if ( user.emailStatus != EmailStatus.Verified && user.accountDays > 100 )
        {
            this.statusCode = StatusCode.EMAIL_NOT_VERIFIED;

            return;
        }

        this.statusCode = StatusCode.SUCCEEDED;

        return true;
    }

    // public async authenticate( { ignitionDb }: DataSources /*,logOut: boolean = false*/ ): Promise<boolean>
    // {
    //     if( this.cookie && this.cookie.length )
    //     {
    //         if( !this.validateCookie( ) )
    //         {
    //             return false;
    //         }

    //         if( !( await ignitionDb.logInUser( this.username ) ) )
    //         {
    //             this.statusCode = StatusCode.LOG_IN_FAILED;

    //             return false
    //         }

    //         this.statusCode = StatusCode.SUCCEEDED;

    //         return true;
    //     }
    //     else if( !this.extractAuth( ) )
    //     {
    //         return false;
    //     }

    //     this.user = await ignitionDb.verifyCrendentials( this.username, this.password );

    //     if( !this.user )
    //     {
    //         this.statusCode = StatusCode.INVALID_CREDENTIAL;

    //         return false;
    //     }

    //     if( !this.validateUser( this.user ) )
    //     {
    //         return false;
    //     }

    //     if( !( await ignitionDb.logInUser( this.username ) ) )
    //     {
    //         this.statusCode = StatusCode.LOG_IN_FAILED;

    //         return;
    //     }

    //     this.setCookie( this.user.username, this.user.email );

    //     this.statusCode = StatusCode.SUCCEEDED;

    //     return true;
    // }

    public cacheUser( user: UserRecord ): boolean
    {
        const { username, email } = user;

        const key = `${username}::${email}`;

        const res = cache.set<UserRecord>( key, user );

        return res;
    }

    public retreiveUser( username: string, email: string ): UserRecord
    {
        const key = `${username}::${email}`;

        console.info( cache.keys(), cache.has( key ), username, email );

        if ( !cache.has( key ) )
        {
            return null;
        } 

        return cache.get<UserRecord>( key );
    }

    public async logIn( { ignitionDb }: DataSources ): Promise<UserRecord>
    {
        let user: UserRecord = null;

        if( this.validateCookie( ) )
        {
            user = this.retreiveUser( this.username, this.email );

            if( !user )
            {
                user = await ignitionDb.findUser( this.username, this.email );

                this.cacheUser( user ); 
            }

            if( !user )
            {
                this.statusCode = StatusCode.USER_DOESNT_EXIST;

                return;
            }

            this.statusCode = StatusCode.SUCCEEDED;

            return user;
        }

        if( !this.extractAuth( ) )
        {
            return;
        }

        user = await ignitionDb.verifyCrendentials( this.username, this.password );

        if( !user )
        {
            this.statusCode = StatusCode.INVALID_CREDENTIAL;

            return;
        }

        if( !this.validateUser( user ) )
        {
            return;
        }

        this.setCookie( user );
    
        this.statusCode = StatusCode.SUCCEEDED;

        return user;
    }
}