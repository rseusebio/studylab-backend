import { FileUpload, }              from "graphql-upload";
import fs                           from 'fs';
import { PDFDocument }              from 'pdf-lib';
import path                         from 'path';
import { v4 as uuidv4 }             from 'uuid';
import util                         from 'util';
import stream                       from "stream";
import IgnitionDb                   from "../../datasources/IgnitionDb";
import { BookInformation, 
         BookProcessResponse,
         BookUploadResponse }       from "../../classes/mutations/BookUpload";
import InternalContext              from "../../classes/InternalContext";

const pipelinePromise = util.promisify (stream.pipeline);

// Create tmp PDF file from args' read stream
const createStorageEnvironment = (): BookInformation =>
{
    const baseDirectory = path.dirname (path.dirname (__dirname))
    const tmpPath       =  path.join (path.resolve(baseDirectory), "./tmp/");
    const bookID        =  uuidv4 ();

    if (!fs.existsSync (tmpPath))
    {
        fs.mkdirSync (tmpPath);
    }

    const bookFolder = path.join (tmpPath, bookID);

    fs.mkdirSync (bookFolder);

    const filePath    = path.join (bookFolder, "book.pdf");
    const writeStream = fs.createWriteStream (filePath);

    return {
        directoryPath: bookFolder,
        filePath,
        writeStream,
        ID: bookID
    };
}

const deleteFiles = (bookInfo: BookInformation) => 
{
    if (fs.existsSync (bookInfo.filePath))
    {
        fs.unlinkSync (bookInfo.filePath);
    }
    
    if (fs.existsSync (bookInfo.directoryPath))
    {
        fs.rmdirSync (bookInfo.directoryPath, {recursive: true});
    }
}

//  Convert tmp PDF file to PNG images
const processAndUploadBook =  async  (bookInfo: BookInformation, bookDb: IgnitionDb): Promise<BookProcessResponse> =>
{
    let response = { Uploaded: false, Error: ""};

    // 1. Check if the book exists
    if (!fs.existsSync  (bookInfo.directoryPath) || !fs.existsSync (bookInfo.filePath))
    {
        response.Error = "NO_DIRECTORY_FOUND";
        
        return response;
    }
    
    const bookDocument = await PDFDocument.load (fs.readFileSync (bookInfo.filePath));

    // 2. Check if there's any pages in this book
    if (bookDocument.getPageCount () <= 0)
    {
        response.Error = "EMPTY_FILE";

        return response;
    }

    const uploadFailures = new Array<number> ();

    const exceptionDict = {};

    const uploadPromises = new Array<Promise<void>> ();

    const pagesQuantity = bookDocument.getPageCount ();

    let pagesCount = 0;

    // 400KB
    let bytesLengthLimit = 400000;

    let totalBytesLength = 0;

    // ToDo:
    // parallelize this whole for

    // 3. Separate each page from the book
    // 3.2 Store each one of them
    // 3.3 Delete it after store attempt
    for (let i = 0; i < pagesQuantity; i++)
    {
        try
        {
            const pageDocument = await PDFDocument.create ();

            const [page] = await pageDocument.copyPages (bookDocument, [i]);

            pageDocument.addPage (page);

            const pageData = await pageDocument.save ();

            const singlePageFilePath = path.join (bookInfo.directoryPath, `${bookInfo.ID}_${i}.pdf`)

            fs.writeFileSync (singlePageFilePath, pageData);

            // ToDo:
            // before upload we should compress the file
            const uploadPromise = bookDb.saveFile (singlePageFilePath, pageData.byteLength)
                .then((uploaded) => {                    
                    if (!uploaded) 
                    {
                        console.info (`page ${i}'s upload FAILED.`);

                        uploadFailures.push (i);
                    }
                });
            
            uploadPromises.push (uploadPromise);

            if (i == pagesQuantity - 1)
            {
                continue;
            }

            pagesCount++;

            totalBytesLength += pageData.byteLength;

            if (totalBytesLength >= bytesLengthLimit)
            {
                console.info (`Waiting for ${pagesCount} to upload ${totalBytesLength / 1000} KB.`);

                await Promise.all (uploadPromises);

                pagesCount = 0;

                totalBytesLength = 0;

                console.info (`going to the next promise ${i + 1}`);
            }     
        }
        catch (err)
        {
            response.Error = "UPLOAD_TO_DB_ERROR";

            console.info ("exception: ", err);
        }
    }

    await Promise.all (uploadPromises);


    // ToDo:
    // Add retry for failed pages

    if (uploadFailures.length > 0)
    {
        console.info ("failures: ", uploadFailures);
    }

    if (exceptionDict)
    {
        console.info ("exceptionDict: ", exceptionDict);
    }

    response.Uploaded = true;
    
    return response;
}

// Resolver to upload a new book 
const bookUpload = async (_, { file}, context): Promise<BookUploadResponse> => {

    const { authorizer, dataSources } = (context as InternalContext);

    let response = new BookUploadResponse ("", false, -1, "", "");

    // 0. Checking if credential are valide or not
    await authorizer.validateUser (dataSources.ignitionDb);

    response.Error      = authorizer.Error;
    response.Authorized = authorizer.Authorized;

    if (!authorizer.Authorized)
    {
        return response;
    } 

    // console.info ("authorized: ", authorizer.userLogin);

    // ToDo:
    // check if the system has memory enough
    // to store the file locally
    const loadedFile = await (file as Promise<FileUpload>);

    if (!loadedFile) 
    {
        response.Error = "Empty file";

        response.finalize ();

        return response;
    }

    response = new BookUploadResponse (loadedFile.filename, false, -1, loadedFile.mimetype, loadedFile.encoding);

    // 1. Check if received file type is PDF or Not.
    if (loadedFile.mimetype != "application/pdf")
    {
        response.Error = "INVALID_FILE_TYPE: " + loadedFile.mimetype;

        response.finalize ();

        return response;
    }
    
    let readStream = loadedFile.createReadStream ();

    // 2. Create a temporary folder to store the files 
    // 2.1 Create an UID for this book 
    // 2.2 Create a folder to store the file instead 
    const bookInfo = createStorageEnvironment ();

    // 3. Saving the file bytes on a local PDF file.
    await pipelinePromise (readStream, bookInfo.writeStream);

    response.Size = readStream.bytesRead;

    if (!dataSources.ignitionDb.insertBookRecord (authorizer.userLogin, bookInfo.ID, loadedFile.filename, response.StartDate))
    {
        response.Uploaded = false;

        response.Error    = "FAILED_TO_INSERT_RECORD";

        response.finalize ();

        return response;
    }
    
    response.Uploaded = true;
    
    //4. Try to upload the book
    const uploadResponse = await processAndUploadBook (bookInfo, dataSources.ignitionDb);

    response.Uploaded = uploadResponse.Uploaded;
    response.Error    = uploadResponse.Error;

    if (!uploadResponse.Uploaded)
    {
        dataSources.ignitionDb.removeBookRecord (bookInfo.ID);
        // if failed we should retry again
        // how ?
        // why should it fail ?
    }

    deleteFiles (bookInfo);

    response.finalize ();

    return response;
}

export default bookUpload;