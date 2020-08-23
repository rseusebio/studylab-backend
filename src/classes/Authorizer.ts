import { Response, CookieOptions } from 'express';
import { v1 as uuidv1 } from 'uuid';
import IgnitionDb from '../datasources/IgnitionDb';
import { encrypt } from '../utils/cryptography';
import { UserRecord } from './mutations/UserCreation';

export default class Authorizer 
{

    public Authorized: boolean;
    public Error:      string;

    private User:   UserRecord;
    private Cookie: string | undefined;
    private Auth:   string | undefined;
    private Res:    Response; // An internal private field referencing to the user response;

    private static CookieName: string = "studylab"

    get userLogin (): string
    {

        return this.User?.Login;
    }

    constructor (cookie: string | undefined, auth: string | undefined, res: Response) 
    {   
        this.Cookie = cookie;
        this.Auth   = auth;
        this.Res    = res;

        this.Authorized = false;
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

        this.User = await db.getUserByLogin (login);

        if (!this.User)
        {
            this.Error = "ACCESS_DENIED";

            return;
        }
        
        // ToDo:
        // if (!user.Enabled)

        const receivedPwd = encrypt (pwd);

        if (receivedPwd != this.User.Password)
        {
            this.Error = "ACCESS_DENIED";

            return;
        }

        this.Authorized  = true;

        // which mechanism checks it?
        const cookieOpts: CookieOptions ={
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
        
        this.Res.cookie (Authorizer.CookieName, uuidv1 (), cookieOpts);

        return;
    }
}