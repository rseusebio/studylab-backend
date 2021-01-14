import express                      from    "express";
import { ApolloServer }             from    "apollo-server-express";
import path                         from    "path";
import typeDefs                     from    "./schema";
import context                      from    "./context";
import dataSources                  from    "./dataSources";
import Query                        from    "./resolvers/queries";
import Mutation                     from    "./resolvers/mutations";
import cors, 
      { CorsOptions }               from    "cors";

const app = express( );

const server = new ApolloServer({
    typeDefs,
    resolvers:{
        Query,
        Mutation
    },
    dataSources,
    context,
});

const whiteList = [
    "http://localhost:3000", 
    ""
]


const corsOpts: CorsOptions = {
    origin: ( origin, callback )=>{

        if( process.env[ "NODE_ENV" ] == "production" )
        {
            if ( !( origin in whiteList ) )
            {
                callback( new Error( "INVALID ORIGIN!!!" ), false );
            }
        }
        
        callback( null, true );
    } ,
    allowedHeaders: [ "Content-Type", "Authorization", "Cookie"],
    methods: [ "GET", "POST", "DELETE", "PUT" ],
    credentials: true,
}

app.use( cors( corsOpts ) );

server.applyMiddleware({ app });

process.env["NODE_CONFIG_DIR"] = path.join( path.dirname( __dirname ), "./config/" );

const serverInfo = app.listen( 4000, () => { console.info(`server has started.`)} );
