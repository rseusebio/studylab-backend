import { ContextFunction } from 'apollo-server-core';
import { ExpressContext } from 'apollo-server-express/dist/ApolloServer';
import ServerContext from './classes/ServerContext';

const context: ContextFunction<ExpressContext, ServerContext> = (expressContext: ExpressContext) => {

    const { req, res } = expressContext;

    const ctx: ServerContext = new ServerContext ();

    ctx.validateUser (req?.headers?.cookie, req?.headers?.authorization, res)

    return ctx;
}

export default context;