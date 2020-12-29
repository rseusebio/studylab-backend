import      fs                           from       'fs';
import      { PDFDocument }              from       'pdf-lib';
import      path                         from       'path';
import      { v4 as uuidv4 }             from       'uuid';
import      util                         from       'util';
import      stream                       from       "stream";
import      IgnitionDb                   from       "../../datasources/IgnitionDb";
import      UploadBookResponse           from       "../../classes/mutations/uploadBook/UploadBookResponse";
import      InternalContext              from       "../../classes/InternalContext";
import      { FileUploadArgs }           from       "../../classes/mutations/uploadBook";
import      config                       from       "config";
import      StorageConfig                from       "../../classes/config/StorageConfig";
import      zlib                         from       "zlib";
import      { StatusCode }               from       "../../classes/Status";
import { Hash } from 'crypto';


const pipelinePromise = util.promisify( stream.pipeline );

const createStorageEnv = ( ) =>
{
    const { BookStorageDir: BookUploadDirectory } = config.get<StorageConfig>( "StorageConfig" );

    const bookId            =   uuidv4( );

    if ( !fs.existsSync( BookUploadDirectory ) )
    {
        fs.mkdirSync( BookUploadDirectory );
    }

    const bookDir = path.join( BookUploadDirectory, bookId );

    fs.mkdirSync( bookDir );

    const bookPath    = path.join( bookDir, "book.pdf" );    

    return {
        bookDir, 
        bookPath,
        bookId, 
    };
}

const deleteFiles = (bookInfo: any) => 
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
const splitAndUpload =  async ( username: string, bookId: string, bookPath: string, title: string, ignitionDb: IgnitionDb ): Promise<StatusCode> =>
{
    const fileBuffer = fs.readFileSync( bookPath );
    
    const pdfDoc = await PDFDocument.load( fileBuffer );

    // 2. Check if there's any pages in this book
    if ( pdfDoc.getPageCount( ) <= 0 )
    {
        return StatusCode.EMPTY_BOOK;
    }

    const totalPages = pdfDoc.getPageCount( );

    const bookRecord = await ignitionDb.uploadBookRecord( username, bookId, title, totalPages, fileBuffer.byteLength );

    if( !bookRecord )
    {
        return StatusCode.FAILED_TO_UPLOAD_BOOK_RECORD;
    }

    const failList = new Set<number>( );

    const uploads = new Array<Promise<void>> ();

    for (let i = 0; i < totalPages; i++)
    {

        const newDoc = await PDFDocument.create( );

        const [ page ] = await newDoc.copyPages( pdfDoc, [ i ] );

        newDoc.addPage( page );

        const data = await newDoc.save( );

        const compressedData = zlib.brotliCompressSync( data ).toString( "base64" );

        const uploadPromise = ignitionDb.uploadPageRecord( compressedData, username, bookId, i )
            .then(
                ( uploaded ) => 
                {
                    if ( !uploaded ) 
                    {
                        console.info(`page ${i}'s upload FAILED.`);

                        failList.add( i );
                    }
                }
            );
        
        uploads.push( uploadPromise );
    }

    await Promise.all (uploads);

    if ( failList.size == totalPages )
    {
        return StatusCode.FAILED_TO_UPLOAD_PAGES;
    }
    else if ( failList.size > 0 )
    {
        // Create a logic to retry upload of those missing pages
    }
    
    return StatusCode.SUCCEEDED;
}

const uploadBook = async (_: any, { file }: FileUploadArgs, { authorizer, dataSources }: InternalContext ): Promise<UploadBookResponse> => {

    let response = new UploadBookResponse( );

    authorizer.authenticate( dataSources );

    if( authorizer.statusCode != 0 )
    {
        response.finalize( authorizer.statusCode );
    }

    const readableFile = await file;

    const { filename, mimetype, encoding } = readableFile;

    if ( !readableFile )  
    {
        response.finalize( StatusCode.COULD_NOT_LOAD_BOOK );

        return response;
    }

    response = new UploadBookResponse( filename, false, undefined, mimetype, encoding );

    // 1. Check if received file type is PDF or Not.
    if ( mimetype != "application/pdf" )
    {
        response.finalize( StatusCode.INVALID_BOOK_TYPE );

        return response;
    }
    
    let readStream = readableFile.createReadStream( );

    const { bookDir, bookId, bookPath } = createStorageEnv( );

    const writeStream = fs.createWriteStream( bookPath );

    // 3. Saving the file bytes on a local PDF file.
    await pipelinePromise( readStream, writeStream );

    response.size = readStream.bytesRead;

    const { ignitionDb } = dataSources;

    
    //4. Try to upload the book
    const uploadResponse = await splitAndUpload( bookInfo, dataSources.ignitionDb );

    response.uploaded = uploadResponse.Uploaded;
    // response.Error    = uploadResponse.Error;

    if (!uploadResponse.Uploaded)
    {
        ignitionDb.removeBookRecord (bookInfo.ID);
        // if failed we should retry again
        // how ?
        // why should it fail ?
    }

    deleteFiles (bookInfo);

    response.finalize ();

    return response;
}

export default uploadBook;