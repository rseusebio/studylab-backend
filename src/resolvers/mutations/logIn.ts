import      InternalContext      from    "../../classes/InternalContext";
import      LogInResponse        from    "../../classes/mutations/logIn/LogInResponse";

const logIn = async ( _: any, __: any, { dataSources:{ ignitionDb }, authorizer }: InternalContext ) => {

    const startTime = Date.now( );

    const res = new LogInResponse( );

    res.user          =  await authorizer.logIn( { ignitionDb } );
    res.statusCode    =  authorizer.statusCode;
    res.elapsedTime   =  ( Date.now( ) - startTime ) / 1000;

    return res;
}

export default logIn;