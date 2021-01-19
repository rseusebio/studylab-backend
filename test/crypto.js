const crypto = require("crypto");
const fs = require("fs");

const { privateKey, publicKey } =   crypto.generateKeyPairSync( "rsa", { modulusLength: 4096 } );
const publicKeyFile             =   "./test/public_key.pem";
const privateKeyFile            =   "./test/private_key.pem";
const passphrase                =   "helloworld";
// const cipher                    =    crypto.createCipheriv( "aes-256-ccm", passphrase, null );
const message                   =   "my_secret_message";

//#region TEST
const encryptedMsg = crypto.publicEncrypt( publicKey, Buffer.from( message ) ).toString( "base64" );
console.info( "encrypted message: ", encryptedMsg );
const msg = crypto.privateDecrypt( privateKey, Buffer.from( encryptedMsg, "base64" ) ).toString( "utf-8" );
console.info( "decrypted msg: ", msg );
//#endregion

let data1 = publicKey.export( { type: "pkcs1", format: "pem" } );
fs.writeFileSync( publicKeyFile, data1 );

let data2 = privateKey.export( { type: "pkcs1", format: "pem" } );
fs.writeFileSync( privateKeyFile, data2 );

data1 = fs.readFileSync( publicKeyFile );
data2 = fs.readFileSync( privateKeyFile );

//#region TEST2
const msg2 = crypto.privateDecrypt( data2, Buffer.from( encryptedMsg, "base64" ) ).toString( "utf-8" );
console.info( `msg2: `, msg2 ); 
const encrypted = crypto.publicEncrypt( data1, Buffer.from( message ) ).toString( "base64" );
const msg3 = crypto.privateDecrypt( privateKey, Buffer.from( encryptedMsg, "base64" ) ).toString( "utf-8" );
console.info( "msg3: ", msg3 );
//#endregion



// const publicKInput = {
//     type: "pkcs1", 
//     key: data1, 
//     format: "pem"
// }
// const publicK = crypto.createPublicKey( publicKInput );
// const privateKeyInput = {
//     type: "pkcs1", 
//     key: data2, 
//     format: "pem",
//     passphrase
// }
// const privateK = crypto.createPrivateKey( privateKeyInput );
