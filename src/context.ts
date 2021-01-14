import      { ContextFunction }     from 'apollo-server-core';
import      { ExpressContext }      from 'apollo-server-express/dist/ApolloServer';
import      Authorizer              from './classes/Authorizer';

const context: ContextFunction<ExpressContext, any> = ( { req, res }: ExpressContext ) => {
    
    const authorizer: Authorizer = new Authorizer( req?.headers?.cookie, req?.headers?.authorization, res );

    const origin = req.get( "origin" );

    res.setHeader( "Access-Control-Allow-Origin", origin );

    return {
        authorizer,
    };
}

export default context;