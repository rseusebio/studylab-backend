interface GetBookCoversRequest
{
    BookIds: Array<string>
}

class BookCoverRecord 
{
    BookId: string;
    Data:   string;

    constructor (id: string, data: string)
    {
        this.BookId  = id;
        this.Data    = data;
    }
}


class GetBookCoversResponse 
{
    public      BookCovers:     Array<BookCoverRecord>
    public      Authorized:     boolean;
    public      Error:          string;
    public      Failures:       Array<string>
    public      ElapsedTime:    Number;
    
    private     StartTime:      Date;

    constructor (auth: boolean = false, err: string = "")
    {
        this.BookCovers     =   new Array<BookCoverRecord> ();
        this.Authorized     =   auth;
        this.Error          =   "";
        this.StartTime      =   new Date ();
    }

    finalize ()
    {
        this.ElapsedTime = (Date.now () - this.StartTime.valueOf ()) / 1000;
    }
}


export {
    GetBookCoversRequest, 
    GetBookCoversResponse,
    BookCoverRecord
}