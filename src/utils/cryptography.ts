import      CryptoJS, { CipherOption }   from       "crypto-js";
import      config                       from       "config";
import      AuthConfig               from       "../classes/config/AuthConfig";

const encrypt = ( msg: string, secret: string, hashSecret: string  ): string => {

    const wordArray = CryptoJS.enc.Utf8.parse( secret );

    const hashedSecret = CryptoJS.SHA512( wordArray, hashSecret );

    const option: CipherOption = {
        mode:    CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    }

    const msgToEncrypt = CryptoJS.enc.Utf8.parse( msg );

    // If you pass hashedSecret.ToString (CryptoJS.enc.Base64) 
    // for some reason the result will be different each time
    const encryptedMsg = CryptoJS.AES.encrypt( msgToEncrypt, hashedSecret, option );

    // return CryptoJS.enc.Base64.stringify (encryptedMsg.ciphertext);

    const result = encryptedMsg.toString( );

    console.info( "encrypted message: ", result );

    return result;
}

const decrypt = ( encryptedMsg: string, secret: string, hashSecret: string ): string => {

    const wordArray = CryptoJS.enc.Utf8.parse( secret );

    const hashedSecret = CryptoJS.SHA512( wordArray, hashSecret );

    const option: CipherOption = {
        mode:    CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    }

    const msg = CryptoJS.AES.decrypt( encryptedMsg, hashedSecret, option );
    
    return msg.toString( CryptoJS.enc.Utf8 );
}

const hashMessage = ( msg: string, hashSecret: string ): string => {

    const wordArray = CryptoJS.enc.Utf16LE.parse( msg );

    return CryptoJS.SHA512( wordArray, hashSecret ).toString( CryptoJS.enc.Base64 );
}

export {
    encrypt,
    decrypt, 
    hashMessage
}


//#region ===================== TEST FUNCTIONS =========================
const test = ()=>{

    const { Keys } =  config.get<AuthConfig>( "Authentication" );

    const { Secret, HashKey } = Keys.get( "Cookie" );

    const var1 = encrypt( "test", Secret, HashKey );
    const var2 = encrypt( "test", Secret, HashKey );
    const var3 = encrypt( "test", Secret, HashKey );

    const secretKey = "MaIeti0rma8PzhuQ4O5UVHrYVk+9R2o0VSV5jPnO5enh6xQ0tnrOmSj1EzUclV0EDiayMdSwxUtQSNdY/Uyc6w==";


    console.info (var1, var2, var3);
    console.info( decrypt( var1, Secret, HashKey ), 
                  decrypt( var1, Secret, HashKey ), 
                  decrypt( var1, Secret, HashKey ), 
                  decrypt( secretKey, Secret, HashKey ) );

    if(var1 !=  var2 || var1 != var3)
    {
        console.info ("different!");
    }
    else 
    {
        console.info ("similar");
    }
}

test();

const test2 = () => {
    const pwd = "mypassword123";
    const pwd2 = "123anotherpassword";
    const pwd3 = "newandfinalpassword";

    const { Keys } =  config.get<AuthConfig>( "Authentication" );

    const { Secret } = Keys.get( "Cookie" ); 

    for(let i = 0; i < 5; i++ )
    {
        let hash1 = hashMessage( pwd, Secret );
        let hash2 = hashMessage( pwd2, Secret );
        let hash3 = hashMessage( pwd3, Secret );

        console.info( pwd, hash1 );
        console.info( pwd2, hash2 );
        console.info( pwd3, hash3 );

        console.info( " =============================== " );
    }
}
//#endregion