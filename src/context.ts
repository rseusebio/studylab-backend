import      { ContextFunction }     from    "apollo-server-core";
import      { ExpressContext }      from    "apollo-server-express/dist/ApolloServer";
import      Authorizer              from    "./classes/Authorizer";
import      IContext                from    "./classes/IContext";
import      cryptoManager           from    "./utils/cryptography";

const context: ContextFunction<ExpressContext, IContext> = ( { req, res }: ExpressContext ) => {
    
    const authorizer: Authorizer = new Authorizer( req?.headers?.authorization );

    res.setHeader( "Access-Control-Allow-Origin", req.get( "origin" ) );

    const context =  {
        authorizer,
        response:   res,
        origin:     req.get( "origin" ),
        cryptoManager
    };

    return context;
}

export default context;