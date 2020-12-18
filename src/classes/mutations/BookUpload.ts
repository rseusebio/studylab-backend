import { WriteStream } from "fs";
import { ObjectId } from "mongodb";
import CommonResponse from "../shared/CommonResponse";

class BookUploadResponse implements CommonResponse {
    
    public FileName:    string;
    public Uploaded:    boolean;
    public Size:        number;
    public Type:        string;
    public Enconding:   string;
    public Authorized:  boolean;
    public Error:       string;
    public ElapsedTime: number;

    private _startDate:  Date;

    get StartDate ()
    {
        return this._startDate;
    }

    constructor (name: string, uploaded: boolean, size: number, type: string, encoding: string)
    {
        this._startDate  = new Date ();

        this.FileName   = name;
        this.Uploaded   = uploaded;
        this.Size       = size;
        this.Type       = type;
        this.Enconding  = encoding;
    }

    public finalize ()
    {
        this.ElapsedTime = (Date.now () - this._startDate.valueOf ()) / 1000;
    }
}

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
    BookRecord,
    BookUploadResponse
}