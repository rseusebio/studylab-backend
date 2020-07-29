import { FileUpload } from "graphql-upload";
import UploadResponse from "../classes/mutations/UploadResponse";
import { PDFImage }   from 'pdf-image';
import fs, { WriteStream }             from 'fs';
import path           from 'path';
import { v4 as uuidv4 }           from 'uuid';

// Create tmp PDF file from args' read stream
const createTmpPDF = () : { filePath: string, writeStream: WriteStream } =>
{
    const tmpDirPath    = "./tmp/";
    const fileId        = uuidv4 ();

    if (!fs.existsSync (tmpDirPath))
    {
        fs.mkdirSync (tmpDirPath);
    }

    const filePath      = path.join (tmpDirPath, fileId + ".pdf");
    const writeStream   = fs.createWriteStream (filePath);


    return { filePath, writeStream };
}

// Convert tmp PDF file to PNG images
const convertPDF =  async (filePath: string): Promise<{succeeded: boolean, error: string}> =>
{
    let response = {succeeded: false, error: ""};

    if (!fs.existsSync (filePath))
    {
        response.error = `Invalid PDF file: ${filePath}`;

        return response;
    }

    const pdfImage = new PDFImage (filePath);

    console.info ("converting");
    
    // const imagesPathList = await pdfImage.convertFile ();

    const imagesPathList = await pdfImage.convertPage (0);

    console.info ("converted");

    if (!imagesPathList || imagesPathList.length <= 0)
    {
        response.error = `Failed to convert file`;

        return response;
    }

    console.info ("imagesPathList: ", imagesPathList);

    response.succeeded = true;
    
    return response;
}

const fileUpload = (parent, args, context, info): Promise<UploadResponse> => {

    let filePromise: Promise<FileUpload> = args.file;

    return filePromise
        .then( 
            async (file) => {

            let response  = new UploadResponse (file.filename, false, -1, file.mimetype, file.encoding);

            if (file.mimetype != "application/pdf")
            {
                response.Error = "Invalid file MIME type: " + file.mimetype;
            }
        
            if (!file) 
            {
                return new UploadResponse ("", false, -1, "", "");
            }

            let readStream = file.createReadStream ();

            let { writeStream, filePath } = createTmpPDF ();

            readStream.pipe (writeStream);

            response.Uploaded = true;
            
            console.info (readStream.readableLength, readStream.bytesRead);

            let convertRes = await convertPDF (filePath);

            console.info ("convertion response: ", convertRes);

            return response;
        })
        .catch( (err: Error) => {

            let response    =  new UploadResponse ("", false, -1, "", "");
            response.Error  = err.message;

            return response;
        })
}

export default fileUpload;