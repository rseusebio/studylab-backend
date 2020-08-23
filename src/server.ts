import { ApolloServer, ServerInfo } from 'apollo-server';
import typeDefs                     from './schema';
import context                      from './context';
import path                         from 'path';
import bookUpload                   from './resolvers/mutations/bookUpload';
import IgnitionDb                   from './datasources/IgnitionDb';
import createUser                   from './resolvers/mutations/createUser';
import healthCheck                  from './resolvers/queries/healthCheck';
import getBooks                     from './resolvers/queries/getBooks';

const server = new ApolloServer ({
    typeDefs: typeDefs,
    resolvers: 
    {
        Query: 
        {
            healthCheck,

            // get all books information
            getBooks,

            // get all book covers to list on a page
            bookCovers: ()=>{
                return false;
            },

            // get last saved informations about a book
            bookInfo: ()=>{
                return false;
            },  
            
            // get a specific page(s) from a book 
            page: ()=>{
                return false;
            },

            // get pages in a smaller size
            // for page slider
            smallPages: () =>{
                return false;
            },

            // get last editions of a page
            pageEditions: () =>{
                return false;
            }       
        },
        Mutation:
        {
            //disable User
            disableUser: ()=>{
                return false;
            },
            // sign up to the site 
            createUser,
            
            // upload a new Book
            bookUpload,

            // disable one or more pages
            disablePages: ()=>{
                return false;
            },

            // set a new book cover
            setBookCover: ()=>{
                return false;
            },

            // save last changes of a page
            editPage: ()=>{
                return false;
            },
        }
    },
    dataSources: () => {
        return  {
            ignitionDb: new IgnitionDb ()
        };  
    },
    context: context
});



server.listen (4002)
      .then ((value: ServerInfo) => {
          console.info (`running at: ${value.url}`);

          process.env["NODE_CONFIG_DIR"] = path.join (path.dirname (__dirname), "./config/");

          console.info (process.env["NODE_CONFIG_DIR"]);
        });