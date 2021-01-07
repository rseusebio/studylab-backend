import { ObjectId } from "mongodb";

export default class BookRecord 
{
    _id:            ObjectId;
    username:       string;
    bookId:         string;
    title:          string;
    totalPages:     number;
    byteLength:     number;
    uploadDate:     Date;
    
    constructor( username: string, bookId: string, title: string, totalPages: number, byteLength: number )
    {
        this._id            =    new ObjectId( );
        this.byteLength     =    byteLength;
        this.username       =    username;
        this.bookId         =    bookId;
        this.title          =    title;
        this.totalPages     =    totalPages;
        this.uploadDate     =    new Date( );
    }
}