import { StatusCode } from "../../Status";
import { UserRecord } from "../signIn";

export default class LogInResponse
{
    public statusCode:     StatusCode;
    public user:           UserRecord;
    public elapsedTime:    number;

    constructor( )
    {
        this.statusCode = null;
    }
}