import  { validate }    from    "email-validator";
import  { StatusCode }  from    "../classes/Status";

const validatePwd = ( pwd: string ): StatusCode => 
{ 
    const re1 = /[\$@!&\*#%+-]/;
    const re2 = /[A-Z]/;
    const re3 = /[a-z]/;

    if( pwd.length < 6 )
    {
        return StatusCode.PASSWORD_TOO_SHORT;
    }
    else if( !re1.test( pwd ) )
    {
        return StatusCode.NO_SPECIAL_CHARS;
    }
    else if( !re2.test( pwd ) )
    {
        return StatusCode.NO_UPPERCASE;
    }
    else if( !re3.test( pwd ) )
    {
        return StatusCode.NO_LOWERCASE;
    }

    return StatusCode.OK;
};

const validateUsername = ( username: string ): StatusCode => 
{
    if ( username.length < 4 )
    {
        return StatusCode.USERNAME_TOO_SHORT;
    }

    const re1 = /[^\d\w]/;

    if( re1.test( username ) )
    {
        return StatusCode.INVALID_USERNAME;
    }

    return StatusCode.OK;
}

const validateEmail = ( email:string ): StatusCode => 
{
    if ( !validate( email ) )
    {
        return StatusCode.INVALID_EMAIL;
    }
    return StatusCode.OK;
}

const validateUserInfo = ( username: string, email: string, password: string ): StatusCode => 
{
    const usernameStatus = validateUsername( username );

    if( usernameStatus != StatusCode.OK )
    {
        return usernameStatus;
    }

    const emailStatus = validateEmail( email );

    if( emailStatus != StatusCode.OK )
    {
        return emailStatus;
    }

    const passwordStatus = validatePwd( password );

    if( passwordStatus != StatusCode.OK )
    {
        return passwordStatus;
    }

    return StatusCode.OK;
}

export default validateUserInfo;