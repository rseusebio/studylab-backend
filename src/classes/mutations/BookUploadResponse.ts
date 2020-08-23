import CommonResponse from "../shared/CommonResponse";

class BookUploadResponse implements CommonResponse {
    
    public FileName:    string;
    public Uploaded:    boolean;
    public Size:        number;
    public Type:        string;
    public Enconding:   string;
    public Authorized:  boolean;
    public Error:       string;

    constructor (name: string, uploaded: boolean, size: number, type: string, encoding: string)
    {
        this.FileName   = name;
        this.Uploaded   = uploaded;
        this.Size       = size;
        this.Type       = type;
        this.Enconding  = encoding;
    }
}

export default BookUploadResponse