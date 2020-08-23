import { FileUpload, processRequest }               from "graphql-upload";
import BookUploadResponse               from "../../classes/mutations/BookUploadResponse";
import fs, { WriteStream }          from 'fs';
import { PDFDocument }              from 'pdf-lib';
import path                         from 'path';
import { v4 as uuidv4 }             from 'uuid';
import util                         from 'util';
import stream                       from "stream";
import IgnitionDb                   from "../../datasources/IgnitionDb";
import { BookInformation, 
         BookProcessResponse }      from "../../classes/mutations/BookUpload";
import InternalContext from "../../classes/InternalContext";

const pipelinePromise = util.promisify (stream.pipeline);

// Create tmp PDF file from args' read stream
const createStorageEnvironment = (): BookInformation =>
{
    const tmpPath    =  path.join (path.resolve(__dirname), "./tmp/");
    const bookID     =  uuidv4 ();

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

    // 3. Separate each page from the book
    // 3.2 Store each one of them
    // 3.3 Delete it after store attempt
    for (let i = 0; i < bookDocument.getPageCount (); i++)
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

            const result = await bookDb.saveFile (singlePageFilePath);

            if (!result)
            {
                response.Error = `FAILED_TO_UPLOAD_PAGE ${i++}`;

                return response;
            }

            fs.unlinkSync (singlePageFilePath);
        }
        catch (err)
        {
            response.Error = "UPLOAD_TO_DB_ERROR";

            return response;
        }
    }

    response.Uploaded = true;
    
    return response;
}

// Resolver to upload a new book 
const bookUpload = async (_, { file}, context): Promise<BookUploadResponse> => {

    const { authorizer, dataSources } = (context as InternalContext);

    // maybe we should use moment.js
    // to get timezone
    const uploadDate = new Date ();

    let response = new BookUploadResponse ("", false, -1, "", "");

    // 0. Checking if credential are valide or not
    await authorizer.validateUser (dataSources.ignitionDb);

    response.Error      = authorizer.Error;
    response.Authorized = authorizer.Authorized;

    if (!authorizer.Authorized)
    {
        return response;
    } 

    // ToDo:
    // check if the system has memory enough
    // to store the file locally
    const loadedFile = await (file as Promise<FileUpload>);

    if (!loadedFile) 
    {
        response.Error = "Empty file";

        return response;
    }

    response = new BookUploadResponse (loadedFile.filename, false, -1, loadedFile.mimetype, loadedFile.encoding);

    // 1. Check if received file type is PDF or Not.
    if (loadedFile.mimetype != "application/pdf")
    {
        response.Error = "INVALID_FILE_TYPE: " + loadedFile.mimetype;

        return response;
    }
    
    let readStream = loadedFile.createReadStream ();

    // 2. Create a temporary folder to store the files 
    // 2.1 Create an UID for this book 
    // 2.2 Create a folder to store the file instead 
    const bookInfo = createStorageEnvironment ();

    // 3. Saving the file bytes on a local PDF file.
    await pipelinePromise (readStream, bookInfo.writeStream);

    response.Uploaded = true;

    response.Size = readStream.bytesRead;

    if (!dataSources.ignitionDb.insertBookRecord (authorizer.userLogin, bookInfo.ID,loadedFile.filename, uploadDate))
    {
        response.Uploaded = false;
        response.Error    = "FAILED_TO_INSERT_RECORD";

        return response;
    }

    //4. Try to upload the book
    const uploadResponse = await processAndUploadBook (bookInfo, dataSources.ignitionDb);

    deleteFiles (bookInfo);

    response.Uploaded = uploadResponse.Uploaded;
    response.Error    = uploadResponse.Error;

    if (!uploadResponse.Uploaded)
    {
        dataSources.ignitionDb.removeBookRecord (bookInfo.ID);
        // if failed we should retry again
        // how ?
        // why should it fail ?
    }

    return response;
}

export default bookUpload;