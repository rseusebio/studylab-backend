import InternalContext                          from "../../classes/InternalContext";
import { GetBooksResponse, GetBooksRequest }    from "../../classes/queries/GetBooks";

const getBooks = async (_, args, context) =>
{
    const { limit } = (args as GetBooksRequest);

    const { dataSources, authorizer } = (context as InternalContext);
    
    // await authorizer.validateUser(dataSources.ignitionDb);

    const response = new GetBooksResponse( /*authorizer.authorized*/ true, /*authorizer.error*/ "");

    // if (!authorizer.authorized)
    // {
    //      return response;
    // }

    response.Books = await dataSources.ignitionDb.getUserBooks( authorizer.username, limit ? 10 : limit);

    return response;
}

export default getBooks;