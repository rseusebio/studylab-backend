import { ApolloServer, ServerInfo } from 'apollo-server';
import typeDefs                     from './schema';
import context                      from './context';
import bookUpload                   from './resolvers/mutations/bookUpload';
import IgnitionDb                   from './datasources/IgnitionDb';
import path                         from 'path';
import createUser                   from './resolvers/mutations/createUser';

const server = new ApolloServer ({
    typeDefs: typeDefs,
    context: context,
    resolvers: 
    {
        Query: 
        {
            health_check: (parent, args, context, info) => {
                return context
            },

            // get all book covers to list on a page
            bookCovers: ()=>{

            },

            // get last saved informations about a book
            bookInfo: ()=>{

            },
            
            // get a specific page(s) from a book 
            page: ()=>{
            
            },

            // get pages in a smaller size
            // for page slider
            smallPages: () =>{

            },

            // get last editions of a page
            pageEditions: () =>{

            }       
        },
        Mutation:
        {
            // sign up to the site 
            createUser,
            
            // upload a new Book
            bookUpload,

            // disable one or more pages
            disablePages: ()=>{

            },

            // set a new book cover
            setBookCover: ()=>{

            },

            // save last changes of a page
            editPage: ()=>{

            },
        }
    },
    dataSources: () => {
        return  {
            ignitionDb: new IgnitionDb ()
        };  
    }
});



server
    .listen (4002)
    .then (
            (value: ServerInfo) => {
                console.info (`running at: ${value.url}`);

                process.env["NODE_CONFIG_DIR"] = path.join (path.dirname (__dirname), "./config/");

                console.info (process.env["NODE_CONFIG_DIR"]);  
            }   
    );