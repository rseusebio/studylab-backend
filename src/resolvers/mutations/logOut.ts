import  IContext        from    "../../classes/IContext";
import  LogInResponse   from    "../../classes/mutations/logIn/LogInResponse";

const logOut = async ( _: any, __: any, { dataSources, authorizer }: IContext ) => {

    const startTime = Date.now( );

    const res = new LogInResponse( );

    // await authorizer.authenticate( dataSources, true );

    res.statusCode  = authorizer.statusCode;
    // res.elapsedTime = ( Date.now( ) - startTime ) / 1000;

    return res;
}

export default logOut;