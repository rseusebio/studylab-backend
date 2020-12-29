import express                      from "express";
import { ApolloServer }             from "apollo-server-express";
import path                         from "path";
import typeDefs                     from "./schema";
import context                      from "./context";
import dataSources                  from "./dataSources";
import Query                        from "./resolvers/queries";
import Mutation                     from "./resolvers/mutations";

const app = express( );

const server = new ApolloServer({
    typeDefs,
    resolvers:{
        Query,
        Mutation
    },
    dataSources,
    context
});

server.applyMiddleware({ app });

process.env["NODE_CONFIG_DIR"] = path.join( path.dirname( __dirname ), "./config/" );

const serverInfo = app.listen( 4000, () => { console.info(`server has started.`)} );
