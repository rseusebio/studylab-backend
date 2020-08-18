import CryptoJS, { enc } from 'crypto-js';
import config from 'config';
import Authentication from '../classes/config/Authentication';

const encrypt =  (msg: string): string => {

    const { SecretKey, HashKey } = config.get<Authentication> ("Authentication");

    const hashedSecret = CryptoJS.SHA512 (SecretKey, HashKey);

    const encryptedMsg = CryptoJS.AES.encrypt (msg, hashedSecret.toString (CryptoJS.enc.Base64));

    return encryptedMsg.toString ();
}

export {
    encrypt
}