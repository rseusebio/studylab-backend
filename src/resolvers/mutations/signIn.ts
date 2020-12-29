import  InternalContext              from   "../../classes/InternalContext";
import  { SignInArgs, 
          SignInResponse }           from   "../../classes/mutations/signIn";
import { StatusCode }                from   "../../classes/Status";

const signIn = async ( _: any, { username, email, password }: SignInArgs , { dataSources, authorizer }: InternalContext ): Promise<SignInResponse> => 
{
    const startTime = Date.now( );

    const { ignitionDb } = dataSources;

    const res = new SignInResponse();

    // ToDo:
    // a. Login and Password should be encrypted 
    // b. decrypt them

    // 0. Check if all fields has been filled
    if ( !username || !password || !email )
    {
        res.statusCode  = StatusCode.INVALID_INFORMATION;
        res.elapsedTime = ( Date.now( ) - startTime ) / 1000;

        return res;
    }

    // 1. Check if login already exists
    const user = await ignitionDb.findUser( username, email );

    if (user)
    {
        res.statusCode  = StatusCode.USER_ALREADY_EXISTS;
        res.elapsedTime = ( Date.now( ) - startTime ) / 1000;

        return res;
    }

    // 2. Try to insert
    // password must be a hash already
    res.user = await ignitionDb.insertNewUser( username, email, password );
    
    if ( !res.user )
    {
        res.statusCode  = StatusCode.USER_CREATION_FAILED;
        res.elapsedTime = ( Date.now( ) - startTime ) / 1000;
        
        return res;
    }

    res.succeeded       =   true;
    res.statusCode      =   StatusCode.SUCCEEDED;
    res.elapsedTime     =   ( Date.now( ) - startTime ) / 1000;
    
    return res;   
}

export default signIn;