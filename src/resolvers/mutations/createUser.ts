import  CryptoJS                 from 'crypto-js';
import  ResolveInfo              from '../../classes/ResolveInfo';
import  { UserCreationArgs, 
          UserCreationResponse } from '../../classes/mutations/UserCreation';
import {encrypt}                 from '../../utils/cryptography';

const creatUser =  async (_, args , context): Promise<UserCreationResponse> => 
{   
    const {dataSources} = (context as ResolveInfo);

    const { login, password } = (args as UserCreationArgs);

    const res = new UserCreationResponse ();

    // ToDo:
    // a. Login and Password should be encrypted 
    // b. decrypt them


    // 0. Check if all fields has been filled
    if (!login || !password)
    {
        res.Error = "INVALID_ARGUMENTS"

        return res;
    }

    const {ignitionDb} = dataSources;

    // 1. Check if login already exists
    const user = await ignitionDb.getUserByLogin (login);

    if (user)
    {
        res.Error = "USER_ALREADY_EXISTS";

        return res;
    }

    // 2. Try to insert
    const inserted  = await ignitionDb.insertNewUser (login, encrypt (password));

    console.info ("inserted: ", inserted);
    
    if (!inserted)
    {
        res.Error = "FAILED_TO_INSERT_USER";
        
        return res;
    }

    res.Success = true;

    return res;   
}

export default creatUser;