import { Response } from 'express';
import { v1 as uuidv1 } from 'uuid';

export default class ServerContext 
{

    public Authorized: boolean;
    public UserName:   string;

    private static CookieName: string = "studylab"

    constructor () 
    {
        this.Authorized = false;
        this.UserName   = "";
    }

    public validateUser (cookie: string | undefined, auth: string | undefined, res: Response) 
    {

        if (cookie && (cookie as string).search (ServerContext.CookieName) >= 0) {
            
            this.Authorized = true;

            return;
        }

        if (auth)
        {
            // To-Do: Authenticate with an encryption password

            this.Authorized  = true;
            this.UserName    = "SingleUser";

            res.cookie (ServerContext.CookieName, uuidv1 ());

            return;
        }

        return;
    }
}