import { ContextFunction }  from 'apollo-server-core';
import { ExpressContext }   from 'apollo-server-express/dist/ApolloServer';
import Authorizer           from './classes/Authorizer';


const context: ContextFunction<ExpressContext, any> = (expressContext: ExpressContext) => {

    const { req, res } = expressContext;

    const authorizer: Authorizer = new Authorizer (req?.headers?.cookie, req?.headers?.authorization, res);

    return {
        authorizer
    };
}

export default context;