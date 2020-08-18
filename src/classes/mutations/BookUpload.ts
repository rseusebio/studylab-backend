import { WriteStream } from "fs";

interface BookInformation
{
    writeStream:    WriteStream;
    directoryPath:  string;
    ID:             string;
}

interface BookProcessResponse 
{
    Uploaded: boolean;
    Error:     string;
}


export {
    BookInformation,
    BookProcessResponse
}