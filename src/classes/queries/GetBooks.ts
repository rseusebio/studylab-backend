import { BookRecord } from "../mutations/BookUpload";

interface GetBooksRequest
{
    limit: number;
}

class GetBooksResponse 
{
    Books:      Array<BookRecord>
    Authorized: boolean;
    Error:      string;

    constructor (auth: boolean = false, err: string = "")
    {
        this.Books       = new Array<BookRecord> ();
        this.Authorized  = auth;
        this.Error       = "";
    }
}


export {
    GetBooksRequest, 
    GetBooksResponse
}