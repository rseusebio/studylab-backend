import      IContext             from    "../../classes/IContext";
import      LogInResponse        from    "../../classes/mutations/logIn/LogInResponse";
import      { StatusCode }       from    "../../classes/Status";

const logIn = async ( _: any, __: any, { dataSources:{ ignitionDb }, authorizer }: IContext ) => 
{
    const res = new LogInResponse( );

    if( authorizer.statusCode != StatusCode.OK )
    {
        res.statusCode = authorizer.statusCode;

        return res;
    }

    res.user          =  await authorizer.logIn( { ignitionDb } );
    res.statusCode    =  authorizer.statusCode;

    return res;
}

export default logIn;