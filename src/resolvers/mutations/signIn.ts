import  InternalContext              from   "../../classes/InternalContext";
import  { SignInArgs, 
          SignInResponse }           from   "../../classes/mutations/signIn";
import  { StatusCode }               from   "../../classes/Status";
import  { validate }                 from   "email-validator";
import  config                       from   "config";
import  { hashMessage }              from   "../../utils/cryptography";
import  AuthConfig                   from   "../../classes/config/AuthConfig";

const validatePwd = ( pwd: string ): boolean => { 
    const re1 = new RegExp( "[\$@!&\*#%+-]" );
    const re2 = new RegExp( "[A-Z]" );
    const re3 = new RegExp( "[a-z]");

    if( pwd.length < 6 )
    {
        return false;
    }
    else if( !re1.test( pwd ) || 
             !re2.test( pwd ) ||
             !re3.test( pwd ) )
    {
        return false;
    }
    else 
    {
       return true;
    }
};

const signIn = async ( _: any, { username, email, password }: SignInArgs , { dataSources, authorizer }: InternalContext ): Promise<SignInResponse> => 
{
    const startTime = Date.now( );

    const { ignitionDb } = dataSources;

    const res = new SignInResponse( );

    // ToDo:
    // DO I REALLY NEED TO DO THIS ?
    // a. Login and Password should be encrypted 
    // b. decrypt them

    //#region VALIDATING ARGUMENTS
    if ( !username || !password || !email )
    {
        res.statusCode  = StatusCode.INVALID_INFORMATION;
        res.elapsedTime = ( Date.now( ) - startTime ) / 1000;

        return res;
    }
    else if ( username.length < 4 )
    {
        res.statusCode  = StatusCode.USERNAME_TOO_SHORT;
        res.elapsedTime = ( Date.now( ) - startTime ) / 1000;

        return res;
    }
    else if( !validate( email ) )
    {
        res.statusCode  = StatusCode.INVALID_EMAIL;
        res.elapsedTime = ( Date.now( ) - startTime ) / 1000;

        return res;
    }
    else if( !validatePwd( password ) )
    {
        res.statusCode  = StatusCode.INVALID_PASSWORD;
        res.elapsedTime = ( Date.now( ) - startTime ) / 1000;

        return res;
    }
    //#endregion

    //#region CHECKING IF USERNAME OR EMAIL ALREADY EXISTS
    const user = await ignitionDb.findUser( username, email );

    if ( user )
    {
        if ( user.username == username )
        {
            res.statusCode  = StatusCode.USERNAME_ALREADY_EXISTS;
            res.elapsedTime = ( Date.now( ) - startTime ) / 1000;

            return res;
        }
        else
        {
            res.statusCode  = StatusCode.EMAIL_ALREADY_USED;
            res.elapsedTime = ( Date.now( ) - startTime ) / 1000;

            return res;
        }
    }
    //#endregion
    
    //#region CREATING THE NEW USER
    const { Keys } = config.get<AuthConfig>( "Authentication" );
    
    res.user = await ignitionDb.insertNewUser( username, email, hashMessage( password, Keys.get("Auth").HashKey) );
    
    if ( !res.user )
    {
        res.statusCode  = StatusCode.USER_CREATION_FAILED;
        res.elapsedTime = ( Date.now( ) - startTime ) / 1000;
        
        return res;
    }

    res.statusCode      =   StatusCode.SUCCEEDED;
    res.elapsedTime     =   ( Date.now( ) - startTime ) / 1000;

    authorizer.setCookie( username, email );
    
    return res;
    //#endregion   
}

export default signIn;