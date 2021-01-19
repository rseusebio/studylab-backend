import  { StatusCode }  from    "../../Status";
import  UserRecord      from    "./UserRecord";

class SignUpResponse 
{
    statusCode:     StatusCode;
    user:           UserRecord;
    _startTime:     number;

    get elapsedTime() :number 
    {
        return ( Date.now( ) - this._startTime ) / 1000;
    }

    constructor( )
    {
        this._startTime = Date.now( );
    }
}

export default SignUpResponse