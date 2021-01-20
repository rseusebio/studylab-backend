import  { StatusCode }      from    "../../Status";
import  { UserRecord }      from    "../signUp";

 class LogInResponse
{
    public      statusCode:     StatusCode;
    public      user:           UserRecord;
    private     _startTime:     number;

    get elapsedTime() :number
    {
        return ( Date.now( ) - this._startTime ) / 1000;
    }

    constructor( )
    {
        this._startTime = Date.now( );
    }
}

export default LogInResponse;