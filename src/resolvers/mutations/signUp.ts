import      IContext                     from       "../../classes/IContext";
import      { SignUpResponse }           from       "../../classes/mutations/signUp";
import      { StatusCode }               from       "../../classes/Status";
import      config                       from       "config";
import      { hashMessage }              from       "../../utils/cryptography";
import      AuthConfig                   from       "../../classes/config/AuthConfig";
import      validateUserInfo             from       "../../utils/validation";

const signUp = async ( _: any, __:any , { dataSources, authorizer }: IContext ): Promise<SignUpResponse> => 
{
    const { ignitionDb, cache } = dataSources;

    const res = new SignUpResponse( );

    //#region VALIDATING USER INFORMATION
    if( authorizer.statusCode != StatusCode.OK )
    {
        res.statusCode  = authorizer.statusCode;

        return res;
    }

    const { username, password, email } = authorizer;
    
    const userInfoStatus = validateUserInfo( username, email, password );

    if( userInfoStatus != StatusCode.OK )
    {
        res.statusCode  = userInfoStatus;

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

            return res;
        }
        else
        {
            res.statusCode  = StatusCode.EMAIL_ALREADY_USED;

            return res;
        }
    }
    //#endregion
    
    //#region CREATING THE NEW USER
    const { Keys }     =  config.get<AuthConfig>( "Authentication" );
    const { HashKey }  =  Keys.get( "Auth" );
    
    res.user = await ignitionDb.insertNewUser( username, email, hashMessage( password, HashKey ) );
    
    if ( !res.user )
    {
        res.statusCode  = StatusCode.USER_CREATION_FAILED;
        
        return res;
    }

    cache.cacheUser( res.user );

    res.statusCode = StatusCode.SUCCEEDED;
    
    return res;
    //#endregion   
}

export default signUp;