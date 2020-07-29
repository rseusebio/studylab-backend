import { ApolloServer, ServerInfo } from 'apollo-server';
import typeDefs                     from './schema';
import context                      from './context';
import fileUpload                   from './mutations/fileUpload';

const server = new ApolloServer ({
    typeDefs: typeDefs,
    context: context,
    resolvers: {
        Query: {
            health_check: (parent, args, context, info) => {
                return context
            }
        },
        Mutation:{
            fileUpload
        }
    }
});

server
    .listen (4000)
    .then (
            (value: ServerInfo) => {
                console.info (`running at: ${value.url}`);
            }   
    );