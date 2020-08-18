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

    const filePath    = path.join (bookFolder, "main.pdf");
    const writeStream = fs.createWriteStream (filePath);

    return {
        directoryPath: bookFolder,
        writeStream,
        ID: bookID
    };
}

//  Convert tmp PDF file to PNG images
const processAndUploadBook =  async  (bookInfo: BookInformation, bookDB: IgnitionDb): Promise<BookProcessResponse> =>
{
    let response = { Uploaded: false, Error: ""};

    const book = path.join (bookInfo.directoryPath, "book.pdf");

    // 1. Check if the book exists
    if (!fs.existsSync  (bookInfo.directoryPath) || !fs.existsSync (book))
    {
        response.Error = "NO_DIRECTORY_FOUND";
        
        return response;
    }
    
    const bookDocument = await PDFDocument.load (fs.readFileSync (book));

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

            const result = await bookDB.saveFile (singlePageFilePath);

            if (!result)
            {
                response.Error = `FAILED_TO_UPLOAD_PAGE ${i++}`;

                return response;
            }

            fs.unlinkSync (singlePageFilePath);
        }
        catch (err)
        {
            console.info (`error: `, err);

            response.Error = "UPLOAD_TO_DB_ERROR";

            return response;
        }
    }

    response.Uploaded = true;
    
    return response;
}

// Resolver to upload a new book 
const bookUpload = async (parent, { file }, { dataSources }): Promise<BookUploadResponse> => {

    const loadedFile = await (file as Promise<FileUpload>);

    if (!loadedFile) 
    {
        let res = new BookUploadResponse ("", false, -1, "", "");

        res.Error = "Empty file";

        return res;
    }

    let response = new BookUploadResponse (loadedFile.filename, false, -1, loadedFile.mimetype, loadedFile.encoding);

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

    //4. Try to upload the book
    const processResponse = await processAndUploadBook (bookInfo, dataSources.ignitionDb);

    response.Uploaded = processResponse.Uploaded;
    response.Error    = processResponse.Error;

    return response;
}

export default bookUpload;