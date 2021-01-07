import { StatusCode } from "../../Status";

export default class UploadBookResponse 
{
    
    public filename:        string;
    public size:            number;
    public type:            string;
    public encoding:       string;

    public statusCode:      StatusCode;
    public elapsedTime:     number;

    private _uploadDate:    Date;

    get uploadDate ( )
    {
        return this._uploadDate;
    }

    constructor ( name: string = "", size: number = 0, type: string = "", encoding: string = "" )
    {
        this._uploadDate  = new Date( );

        this.filename   = name;
        this.size       = size;
        this.type       = type;
        this.encoding  = encoding;
    }

    public finalize( statusCode: StatusCode )
    {
        this.statusCode     =   statusCode;
        this.elapsedTime    =   ( Date.now( ) - this._uploadDate.valueOf( ) ) / 1000;
    }
}
