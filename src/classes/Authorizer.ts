import      { Response, CookieOptions }  from       "express";
import      UserRecord, 
            { AccountStatus, 
              EmailStatus }              from       "./mutations/signIn/UserRecord";
import      { StatusCode      }          from       "./Status";
import      config                       from       "config";
import      AuthConfig               from       "./config/AuthConfig";
import      DataSources                  from       "../datasources/DataSources";
import      { parseCookie }              from       "../utils/utils";
import      { decrypt, encrypt }         from       "../utils/cryptography";

export default class Authorizer 
{
    public statusCode:  StatusCode;

    private user:       UserRecord;
    private cookie:     string | undefined;
    private auth:       string | undefined;
    public  username:   string | undefined;
    private password:   string | undefined;

     // An internal private field referencing to the user response;
    private res:    Response;

    private CookieName: string = "studylab"

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

        this.username  = username;
        this.password  = pwd;

        return true;
    }

    public validateCookie( ): boolean
    {
        const { CookieName, Keys }  = config.get<AuthConfig>( "Authentication" );

        if ( !this.cookie || ( this.cookie as string ).search( CookieName + "=" ) < 0 ) 
        {
            this.statusCode = StatusCode.NO_COOKIE_RECEIVED;

            return false;
        }

        const jsonCookie = parseCookie( this.cookie );

        if( !jsonCookie || !( CookieName in jsonCookie ) )
        {
            this.statusCode = StatusCode.NO_COOKIE_RECEIVED;

            return false;
        }

        const cookieKeys = Keys.get( "Cookie" );

        const cookie = decrypt( jsonCookie[CookieName], cookieKeys.Secret, cookieKeys.HashKey );

        const [ username, email ] = cookie.split( "::" );

        this.statusCode =   StatusCode.SUCCEEDED;
        this.user       =   new UserRecord( username, email, "" );
        
        return true;
    }

    public generateCookie( username: string, email: string ): string
    {
        const cookie = `${username}::${email}::${new Date( ).toISOString( )}`;

        const { CookieName, Keys }  = config.get<AuthConfig>( "Authentication" );

        const cookieKeys = Keys.get( "Cookie" );

        return encrypt( cookie, cookieKeys.Secret, cookieKeys.HashKey );
    }

    public setCookie( username: string, email: string ) : void
    {
        // which mechanism checks it?
        const validHours = 24; 

        const cookieOpts: CookieOptions = {
            maxAge: validHours * 60 * 60 * 1000 // 24 hours
        }
        
        this.res.cookie( this.CookieName, this.generateCookie( username ?? this.user.username, email ?? this.user.email ), cookieOpts );
    }

    public validateUser( ): boolean
    {
        if ( this.user.accountStatus != AccountStatus.Active )
        {
            this.statusCode = StatusCode.USER_DISABLED;

            return;
        }

        if ( this.user.emailStatus != EmailStatus.Verified && this.user.accountDays > 1 )
        {
            this.statusCode = StatusCode.EMAIL_NOT_VERIFIED;

            return;
        }

        if ( this.password != this.user.password )
        {
            this.statusCode = StatusCode.ACCESS_DENIED;

            return;
        }

        this.statusCode = StatusCode.SUCCEEDED;

        // which mechanism checks it?
        const validHours = 24; 

        const cookieOpts: CookieOptions = {
            maxAge: validHours * 60 * 60 * 1000 // 24 hours
        }
        
        this.res.cookie( this.CookieName, this.generateCookie( this.user.username, this.user.email ), cookieOpts );

        return true;
    }

    public async authenticate( { ignitionDb }: DataSources, logOut: boolean = false ): Promise<boolean>
    {
        if( this.cookie && this.cookie.length )
        {
            if( !this.validateCookie( ) )
            {
                return;
            }
        }

        if( !this.extractAuth( ) )
        {
            return;
        }

        this.user = await ignitionDb.findUser( this.username );

        if( !this.user )
        {
            this.statusCode = StatusCode.USER_DOESNT_EXIST;

            return;
        }

        if( !this.validateUser( ) )
        {
            return;
        }

        if( logOut )
        {
            this.statusCode = StatusCode.SUCCEEDED;

            if( !( await ignitionDb.logOutUser( this.username ) ) )
            {
                this.statusCode = StatusCode.LOGOUT_FAILED;
            }

            return;
        }

        if( this.user.isLogged )
        {
            this.statusCode = StatusCode.SUCCEEDED;

            return true;
        }

        if( !( await ignitionDb.logInUser( this.username ) ) )
        {
            this.statusCode = StatusCode.LOG_IN_FAILED;

            return;
        }

        this.statusCode = StatusCode.SUCCEEDED;

        return true;
    }
}