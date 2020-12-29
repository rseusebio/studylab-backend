import { ObjectId } from "mongodb";

export default class PageRecord 
{
    _id:            ObjectId;
    bookId:         string;
    username:       string;
    pageIndex:      number;
    data:           string;
    
    constructor( username: string, bookId: string, pageIndex: number, data: string )
    {
        this._id            =    new ObjectId( );

        this.username       =    username;
        this.bookId         =    bookId;
        this.pageIndex      =    pageIndex;
        this.data           =    data;
    }
}