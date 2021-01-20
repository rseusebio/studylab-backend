import      UserRecord, 
            { AccountStatus, 
              EmailStatus }              from       "./mutations/signUp/UserRecord";
import      { StatusCode      }          from       "./Status";
import      cryptoManager                from       "../utils/cryptography";
import      ignitionDb                   from       "../datasources/IgnitionDb";
import      { cache }                    from       "../datasources";

export default class Authorizer 
{   
    public      statusCode:  StatusCode;
    public      username:    string | undefined;
    public      email:       string | undefined;   
    public      password:    string | undefined;

    constructor( auth: string ) 
    {   
        this.extract( auth );
    }

    private setCredentials( user: UserRecord )
    {
        this.username   = user.username;
        this.email      = user.email;
        this.password   = user.password;
    }
    
    public extract( auth: string ): boolean
    {
        if( !auth )
        {
            this.statusCode = StatusCode.EMPTY_CREDENTIAL;

            return false;
        }

        const [ type, credentials ] = auth.split( " " );

        if( !type ||
            !credentials ||
            type.toLowerCase() != "basic" ||
            type.toLowerCase() != "custom"
        )
        {
            this.statusCode = StatusCode.INVALID_CREDENTIAL;

            return false;
        }

        const userInfo = Buffer.from( credentials, "base64" ).toString( "utf-8" );

        if( !userInfo )
        {
            this.statusCode = StatusCode.INVALID_CREDENTIAL;
        }

        let decryptedCredential = cryptoManager.decrypt( userInfo );

        const [ username, email, pwd ] = decryptedCredential.split( ":" );

        if ( !username || !pwd || !email )
        {
            this.statusCode = StatusCode.INVALID_CREDENTIAL;

            return false;
        }
        
        this.username  =    username;
        this.email     =    email;
        this.password  =    pwd;

        this.statusCode = StatusCode.OK;

        return true;
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

    public async logIn( ): Promise<UserRecord>
    {
        let user: UserRecord = null;

        let key = cache.userKey( this.username, this.password, this.email );

        user = cache.getUser( key )

        if( user )
        {
            this.statusCode = StatusCode.SUCCEEDED;

            if( !this.validateUser( user ))
            {
                return null;
            }

            return user;
        }

        user = await ignitionDb.verifyCrendentials( this.username, this.password );

        if( !user )
        {
            this.statusCode = StatusCode.INVALID_CREDENTIAL;

            return;
        }

        if( !this.validateUser( user ) )
        {
            return null;
        }

        this.setCredentials( user );

        cache.cacheUser( user );

        this.statusCode = StatusCode.SUCCEEDED;

        return user;
    }

    public getUser( ): UserRecord
    {
        const key = cache.userKey( this.username, this.password, this.email );

        return cache.getUser( key );
    }
}