import { WriteStream } from "fs";
import { ObjectId } from "mongodb";
import { title } from "process";

interface BookInformation
{
    writeStream:    WriteStream;
    directoryPath:  string;
    filePath:       string;
    ID:             string;
}

interface BookProcessResponse
{
    Uploaded: boolean;
    Error:     string;
}

class BookRecord 
{
    _id:          ObjectId;
    Login:        string;
    Id:           string;
    Title:        String;
    UploadDate:   Date;

    constructor (login: string, id: string, title: string, date: Date)
    {
        this._id          = new ObjectId ();
        this.Login        = login;
        this.Id           = id;
        this.Title        = title;
        this.UploadDate   = date;
    }
}


export {
    BookInformation,
    BookProcessResponse,
    BookRecord
}