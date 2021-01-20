import      IContext             from    "../../classes/IContext";
import      LogInResponse        from    "../../classes/mutations/logIn/LogInResponse";
import      { StatusCode }       from    "../../classes/Status";

const logIn = async ( _: any, __: any, { authorizer }: IContext ) => 
{
    const res = new LogInResponse( );

    if( authorizer.statusCode == StatusCode.OK )
    {
        res.user          =  await authorizer.logIn( );
        res.statusCode    =  authorizer.statusCode;

        return res;
    }
    else if( authorizer.statusCode == StatusCode.SUCCEEDED )
    {
        res.user        = authorizer.getUser( );
        res.statusCode  = authorizer.statusCode;

        return res; 
    }
    else
    {
        res.user = null;
        res.statusCode = authorizer.statusCode;

        return res;
    }
}

export default logIn;