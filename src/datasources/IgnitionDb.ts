import { DataSource }                              from 'apollo-datasource';
import config                                      from 'config';
import MongoConfig                                 from '../classes/config/MongoConfig';
import mongodb, { MongoClient, GridFSBucket, CollectionInsertOneOptions, ObjectId }      from 'mongodb';
import util                                        from 'util';
import stream                                      from 'stream';
import path                                        from 'path';
import fs                                          from 'fs';
import { UserRecord } from '../classes/mutations/UserCreation';

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

        console.info (URI);

        return URI;
    }

    async isClientConnected ()
    {
        if (!this.client.isConnected ())
        {
            try
            {
                this.client = await this.client.connect (); 
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
    }

    async saveFile (filePath: string): Promise<boolean>
    {
        
        if (!this.isClientConnected ())
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
        if (!this.isClientConnected ())
        {
            return null;
        }

        const { DbName } = this.mongoConfig;

        const db = this.client.db (DbName);

        const collName = "Users";

        const user = db.collection<UserRecord> (collName);

        return user.findOne<UserRecord> ({"Login": login});
    }

    async insertNewUser (login:string, pwd: string): Promise<ObjectId | null>
    {
        if (!this.isClientConnected ())
        {
            return null;
        }

        const { DbName } = this.mongoConfig;

        const db = this.client.db (DbName);

        const collName = "Users";

        const userColl = db.collection<UserRecord> (collName);

        const options: CollectionInsertOneOptions = {
            forceServerObjectId: true
        }

        const user = new UserRecord (login, pwd);
        
        const { insertedCount, insertedId } = await userColl.insertOne (user, options);

        if (insertedCount == 1)
        {
            return insertedId
        }
        
        return null;
    }

}

export default IgnitionDb;