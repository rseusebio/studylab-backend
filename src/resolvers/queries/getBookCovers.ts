import InternalContext                          from "../../classes/InternalContext";
import { GetBookCoversRequest, 
         GetBookCoversResponse, 
         BookCoverRecord }                      from "../../classes/queries/GetBookCovers";
import { v4 as uuidv4 }                         from 'uuid';
import path                                     from "path";
import fs                                       from 'fs';

const createTmpDir = (): string =>
{    
    
    const baseDirectory =  path.dirname (path.dirname (__dirname))
    const tmpPath       =  path.join (path.resolve(baseDirectory), "./tmp/");

    if (!fs.existsSync (tmpPath))
    {
        fs.mkdirSync (tmpPath);
    }

    const tmpDirId = uuidv4 ();

    const tmpDir = path.join (tmpPath, tmpDirId);

    fs.mkdirSync (tmpDir);

    return tmpDir;

}

const getBookCovers = async (_, args, context): Promise<GetBookCoversResponse> =>
{
    const response = new GetBookCoversResponse ();

    const { BookIds } = (args as GetBookCoversRequest);

    const { dataSources, authorizer } = (context as InternalContext);
    
    await authorizer.validateUser (dataSources.ignitionDb);

    response.Authorized = authorizer.Authorized;
    response.Error      = authorizer.Error;
    
    if (!authorizer.Authorized)
    {
        response.finalize ();

        return response;
    }

    if (!BookIds || BookIds.length <= 0)
    {
        response.Error = "EMPTY_BOOK_IDS_LIST";

        response.finalize ();

        return response;
    }

    const tmpDir = createTmpDir ();

    const bookDownloads    = [];
    const downloadFailures = [];

    for (const bookId of BookIds)
    {
        const download =  dataSources.ignitionDb.getBookPage (bookId, 0, tmpDir)
                            .then(
                                (value) => {
                                    if (!value) {
                                        downloadFailures.push (bookId);

                                        console.info (`failed to download book: "${bookId}"`);
                                    }
                                });

        bookDownloads.push (download);
    }

    await Promise.all (bookDownloads);

    if (downloadFailures.length > 0)
    {
        // ToDo:
        // retry download missing pages
    }

    let counter = 0;

    for (let page of fs.readdirSync (tmpDir))
    {
        counter++;

        page = path.join (tmpDir, page);
        
        const arr = page.split ("/");

        const pageName = arr[arr.length - 1].replace (".pdf", "");

        console.info (`about to read: ${page}`);


        fs.readFile (page, (err, data)=>{
            if (err)
            {
                // ToDo:
                // what to do?
                response.Failures.push (pageName);

                console.info ('reading err: ', pageName, err);
            }
            else
            {
                const pageData = data.toString ("base64");

                const bookCover = new BookCoverRecord (pageName.replace ("_0", ""), pageData);

                response.BookCovers.push (bookCover);

                console.info (`${pageName} read`);
            }

            counter--;

            console.info (`${pageName} counter: ${counter}`);
        });
    }
    
    console.info ("Waiting all books to be read");

    while (counter > 0) {}

    console.info ("Done")

    response.finalize ();

    return response;
}

export default getBookCovers;