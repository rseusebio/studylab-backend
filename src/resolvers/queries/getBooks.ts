import InternalContext                          from "../../classes/InternalContext";
import { GetBooksResponse, GetBooksRequest }    from "../../classes/queries/GetBooksResponse";

const getBooks = async (_, args, context) =>
{
    const { limit } = (args as GetBooksRequest);

    const { dataSources, authorizer } = (context as InternalContext);
    
    await authorizer.validateUser (dataSources.ignitionDb);

    const response = new GetBooksResponse (authorizer.Authorized, authorizer.Error);

    if (!authorizer.Authorized)
    {
         return response;
    }

    response.Books = await dataSources.ignitionDb.getUserBooks (authorizer.userLogin, limit ? 10 : limit);

    return response;
}

export default getBooks;