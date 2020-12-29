import { StatusCode } from "../../Status";

export default class LogResponse
{
    public statusCode:     StatusCode;
    public elapsedTime:    number;

    constructor( )
    {
        this.statusCode = null;
    }
}