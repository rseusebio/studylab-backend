import      UserRecord, 
            { AccountStatus, 
              EmailStatus }              from       "./mutations/signUp/UserRecord";
import      { StatusCode      }          from       "./Status";
import      config                       from       "config";
import      AuthConfig                   from       "./config/AuthConfig";
import      DataSources                  from       "../classes/DataSources";
import      { decrypt, 
              encrypt, 
              hashMessage }              from       "../utils/cryptography";

export default class Authorizer 
{   
    public  statusCode:  StatusCode;
    
    public  username:    string | undefined;
    public  email:       string | undefined;   
    public  password:    string | undefined;

    constructor( auth: string ) 
    {   
        this.extract( auth );
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

        const logInInfo = Buffer.from( credentials, "base64" ).toString( "utf-8" );

        if( !logInInfo )
        {
            this.statusCode = StatusCode.INVALID_CREDENTIAL;
        }

        // this content should be encrypted

        const [ username, email, pwd ] = logInInfo.split( ":" );

        if ( !username || !pwd || !email )
        {
            this.statusCode = StatusCode.INVALID_CREDENTIAL;

            return false;
        }
        
        const { Keys } = config.get<AuthConfig>( "Authentication" );

        this.username  = username;
        this.email     = email;
        this.password  = hashMessage( pwd, Keys.get( "Auth" ).HashKey );

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

    public async logIn( { ignitionDb }: DataSources ): Promise<UserRecord>
    {
        let user: UserRecord = null;

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
    
        this.statusCode = StatusCode.SUCCEEDED;

        return user;
    }
}