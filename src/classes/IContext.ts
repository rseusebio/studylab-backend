import      DataSources             from        "./DataSources";
import      Authorizer              from        "./Authorizer";
import      { Response }            from        "express";
import      { CryptoManager }       from        "../utils/cryptography";

interface IContext 
{
    dataSources?:   DataSources;
    authorizer:     Authorizer;
    response:       Response;
    origin:         string;
    cryptoManager:  CryptoManager;
}

export default IContext;