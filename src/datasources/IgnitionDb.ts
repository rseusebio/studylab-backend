import { DataSource }                              from 'apollo-datasource';
import config                                      from 'config';
import MongoConfig                                 from '../classes/config/MongoConfig';
import mongodb, { MongoClient, GridFSBucket, CollectionInsertOneOptions }      from 'mongodb';
import util                                        from 'util';
import stream                                      from 'stream';
import path                                        from 'path';
import fs                                          from 'fs';
import { UserRecord }                              from '../classes/mutations/UserCreation';

const pipelinePromise = util.promisify (stream.pipeline);

class IgnitionDb extends DataSource
{
    client:      MongoClient;
    mongoConfig: MongoConfig;
    error:       string;

    constructor ()
    {
        super ();

        this.mongoConfig = config.get<MongoConfig> ("MongoDb");

        this.client      = new mongodb.MongoClient (this.retreiveURI (), { useNewUrlParser : true, useUnifiedTopology: true });   
        
        this.error       = ""; 
    }

    retreiveURI ()
    {
        const {User, Password, Host, DbName} = this.mongoConfig;

        const URI = `mongodb+srv://${User}:${Password}@${Host}/${DbName}?retryWrites=true&w=majority`;

        return URI;
    }

    async isClientConnected ()
    {
        if (!this.client.isConnected ())
        {
            try
            {
                await this.client.connect (); 
            }
            catch (error)
            {
                console.info ("COULD NOT CONNECT: ", error);

                return false;
            }
            finally 
            {
                if (!this.client.isConnected ())
                {
                    console.info ("STILL COULD NOT CONNECT");

                    return false;
                }
            }
        }

        return true;
    }

    async saveFile (filePath: string): Promise<boolean>
    {
        const isConnected = await this.isClientConnected ();

        if (!isConnected)
        {
            return false;
        }

        const { DbName } = this.mongoConfig;

        const bucket = new GridFSBucket (this.client.db (DbName));

        const fileName = path.basename (filePath);

        try
        {
            await pipelinePromise (fs.createReadStream (filePath), bucket.openUploadStream (fileName));
        }
        catch (err)
        {
            this.error = err + "";
            console.info ("err: ", err);

            return false;
        }

        return true;
    }

    async getUserByLogin (login: string): Promise<UserRecord | null>
    {
        const isConnected = await this.isClientConnected ();
        
        if (!isConnected)
        {
            return null;
        }

        const { DbName } = this.mongoConfig;

        const db = this.client.db (DbName);

        const collName = "Users";

        const userColl = db.collection<UserRecord> (collName);

        const user = await userColl.findOne<UserRecord> ({"Login": login});

        console.info (user);

        return user;
    }

    async insertNewUser (login:string, pwd: string): Promise<boolean>
    {
        const isConnected = await this.isClientConnected ();
        
        if (!isConnected)
        {
            return true;
        }

        const { DbName } = this.mongoConfig;

        const db = this.client.db (DbName);

        const collName = "Users";

        const userColl = db.collection<UserRecord> (collName);

        const user = new UserRecord (login, pwd);
        
        const { insertedCount, insertedId, result } = await userColl.insertOne (user);

        if (insertedCount == 1)
        {
            return true
        }
        
        return false;
    }

}

export default IgnitionDb;