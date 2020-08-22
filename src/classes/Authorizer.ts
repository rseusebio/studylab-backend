import { Response } from 'express';
import { v1 as uuidv1 } from 'uuid';
import IgnitionDb from '../datasources/IgnitionDb';
import { encrypt } from '../utils/cryptography';

export default class Authorizer 
{

    public Authorized: boolean;
    public UserName:   string;
    public Error:      string;

    private Cookie: string | undefined;
    private Auth:   string | undefined;
    private Res:    Response; // An internal private field referencing to the user response;

    private static CookieName: string = "studylab"

    constructor (cookie: string | undefined, auth: string | undefined, res: Response) 
    {   
        this.Cookie = cookie;
        this.Auth   = auth;
        this.Res    = res;

        this.Authorized = false;
        this.UserName   = "";
        this.Error      = "";
    }

    public async validateUser (db: IgnitionDb) 
    {
        // ToDo:
        // install a cookie parser
        if (this.Cookie && (this.Cookie as string).search (Authorizer.CookieName) >= 0) {
            
            this.Authorized = true;

            return;
        }

        if (!this.Auth)
        {
            this.Error = "NO_CREDENTIALS";

            return;
        }

        const [type, credentials] = this.Auth.split (" ");

        if (!type || type.toLowerCase () != "basic" || !credentials)
        {
            this.Error = "INVALID_CREDENTIAL";

            return;
        }

        const loginAndPwd = new Buffer (credentials, "base64").toString ('utf-8');

        const [login, pwd] = loginAndPwd.split (":");

        if (!login || !pwd)
        {
            this.Error = "INVALID_CREDENTIAL";

            return;
        }

        console.info (login, pwd);

        const user = await db.getUserByLogin (login);

        if (!user)
        {
            this.Error = "ACCESS_DENIED";

            return;
        }
        
        // ToDo:
        // if (!user.Enabled)

        const receivedPwd = encrypt (pwd);

        console.info (receivedPwd, user.Password)

        if (receivedPwd != user.Password)
        {
            this.Error = "ACCESS_DENIED";

            return;
        }

        this.Authorized  = true;
        
        this.Res.cookie (Authorizer.CookieName, uuidv1 ());

        return;
    }
}