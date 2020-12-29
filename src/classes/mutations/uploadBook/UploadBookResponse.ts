import { WriteStream } from "fs";
import { StatusCode } from "../../Status";

export default class UploadBookResponse 
{
    
    public fileName:        string;
    public uploaded:        boolean;
    public size:            number;
    public type:            string;
    public enconding:       string;

    public statusCode:      StatusCode;
    public elapsedTime:     number;

    private _uploadDate:    Date;

    get uploadDate ( )
    {
        return this._uploadDate;
    }

    constructor ( name: string = "", uploaded: boolean = false, size: number = 0, type: string = "", encoding: string = "" )
    {
        this._uploadDate  = new Date( );

        this.fileName   = name;
        this.uploaded   = uploaded;
        this.size       = size;
        this.type       = type;
        this.enconding  = encoding;
    }

    public finalize( statusCode: StatusCode )
    {
        this.statusCode     =   statusCode;
        this.elapsedTime    =   ( Date.now( ) - this._uploadDate.valueOf( ) ) / 1000;
    }
}
