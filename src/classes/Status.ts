
enum StatusCode  
{
    SUCCEEDED = 0, 

    // CREDENTIAL ERRORS
    EMPTY_CREDENTIAL = 1,
    INVALID_CREDENTIAL, 
    ACCESS_DENIED,
    USER_DISABLED,
    USER_DOESNT_EXIST,
    LOG_IN_FAILED, 
    LOGOUT_FAILED, 
    NO_COOKIE_RECEIVED,
    EMAIL_NOT_VERIFIED,

    // DATABASE ERRORS
    DATABASE_NOT_CONNECTED = 101,
    FILE_UPLOAD_FAILED,
    PAGE_DOWNLOAD_FAILED,

    // SIGN IN ERRORS
    INVALID_INFORMATION = 201,
    USER_ALREADY_EXISTS, 
    INVALID_EMAIL, 
    EMAIL_ALREADY_USED,
    USER_CREATION_FAILED,

    // UPLOAD ERROS
    COULD_NOT_LOAD_BOOK = 301, 
    INVALID_BOOK_TYPE, 
    EMPTY_BOOK, 
    FAILED_TO_UPLOAD_BOOK_RECORD,
    FAILED_TO_UPLOAD_PAGES


}   

const ErrorMap = new Map<StatusCode, String>();


//#region AUTHENTICATION ERRORS 
ErrorMap[StatusCode.EMPTY_CREDENTIAL]    = "Fill in request authnetication";
ErrorMap[StatusCode.INVALID_CREDENTIAL]  = "Invalid credential. Please check your password again.";
//#endregion



//#region DATABASE ERRORS
//#endregion

export {
    ErrorMap,
    StatusCode,
};