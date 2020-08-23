import CryptoJS, { CipherOption } from 'crypto-js';
import config from 'config';
import Authentication from '../classes/config/Authentication';

const encrypt = (msg: string): string => {

    const { SecretKey, HashKey } = config.get<Authentication> ("Authentication");

    const wordArray = CryptoJS.enc.Utf16LE.parse (SecretKey);

    const hashedSecret = CryptoJS.SHA512 (wordArray, HashKey);

    const option: CipherOption = {
        mode:    CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    }

    const msgToEncrypt = CryptoJS.enc.Utf16LE.parse (msg);

    // If you pass hashedSecret.ToString (CryptoJS.enc.Base64) 
    // for some reason the result will be different each time
    const encryptedMsg = CryptoJS.AES.encrypt (msgToEncrypt, hashedSecret, option);

    // return CryptoJS.enc.Base64.stringify (encryptedMsg.ciphertext);

    return encryptedMsg.toString ()
}

const decrypt = (encryptedMsg: string): string => {

    const { SecretKey, HashKey } = config.get<Authentication> ("Authentication");

    const wordArray = CryptoJS.enc.Utf16LE.parse (SecretKey);

    const hashedSecret = CryptoJS.SHA512 (wordArray, HashKey);

    const option: CipherOption = {
        mode:    CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    }

    const msg = CryptoJS.AES.decrypt (encryptedMsg, hashedSecret, option);
    
    return msg.toString (CryptoJS.enc.Utf16LE);
}

export {
    encrypt
}


const test = ()=>{
    const var1 = encrypt ("test");
    const var2 = encrypt ("test");
    const var3 = encrypt ("test");


    console.info (var1, var2, var3);
    console.info (decrypt(var1), decrypt(var2), decrypt(var3));

    if(var1 !=  var2 || var1 != var3)
    {
        console.info ("different!");
    }
    else 
    {
        console.info ("similar");
    }
}
