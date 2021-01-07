import InternalContext      from    "../../classes/InternalContext";
import LogResponse          from    "../../classes/mutations/logIn/LogResponse";


//this should be a mutation
const logIn = async ( _: any, __: any, { dataSources, authorizer }: InternalContext ) => {

    const startTime = Date.now( );

    const res = new LogResponse( );

    await authorizer.authenticate( dataSources );

    res.statusCode   =  authorizer.statusCode;
    res.elapsedTime  =  ( Date.now( ) - startTime ) / 1000;

    return res;
}

export default logIn;