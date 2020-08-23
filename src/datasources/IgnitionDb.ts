import { DataSource }                              from 'apollo-datasource';
import config                                      from 'config';
import MongoConfig                                 from '../classes/config/MongoConfig';
import mongodb, { MongoClient, GridFSBucket, CollectionInsertOneOptions }      from 'mongodb';
import util                                        from 'util';
import stream                                      from 'stream';
import path                                        from 'path';
import fs                                          from 'fs';
import { UserRecord }                              from '../classes/mutations/UserCreation';
import { BookRecord } from '../classes/mutations/BookUpload';

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
                return false;
            }
            finally 
            {
                if (!this.client.isConnected ())
                {
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

        const userColl = db.collection<UserRecord> ("Users");

        const user = new UserRecord (login, pwd);
        
        const { insertedCount } = await userColl.insertOne (user);

        if (insertedCount == 1)
        {
            return true
        }
        
        return false;
    }

    async insertBookRecord (login: string, bookId: string, fileName: string, uploadDate: Date): Promise<boolean>
    {
        if (await this.isClientConnected () == false)
        {
            return false;
        }

        const { DbName } = this.mongoConfig;

        const db = this.client.db (DbName);

        const coll = db.collection<BookRecord> ("Books");

        const title = fileName.endsWith ('.pdf') ? fileName.replace (".pdf", "") : fileName;

        const book = new BookRecord (login, bookId, title, uploadDate);
        
        const { insertedCount } = await coll.insertOne (book);

        if (insertedCount == 1)
        {
            return true
        }
        
        return false;
    }

    async removeBookRecord (bookId: string): Promise<boolean>
    {
        if (await this.isClientConnected () == false)
        {
            return false;
        }

        const { DbName } = this.mongoConfig;

        const db = this.client.db (DbName);

        const coll = db.collection<BookRecord> ("Books");
        
        const { deletedCount } = await coll.deleteOne ({ Id: bookId});

        if (deletedCount == 1)
        {
            return true
        }
        
        return false;
    }

    async getUserBooks (login: string, sizeLimit: number = 10): Promise<Array<BookRecord>>
    {
        let books = new Array<BookRecord> ();

        if (await this.isClientConnected () == false)
        {
            return books
        }

        const { DbName } = this.mongoConfig;

        const db = this.client.db (DbName);

        const coll = db.collection<BookRecord> ("Books");

        const query = {
            "Login": login
        }

        return await coll.find (query).limit (sizeLimit).toArray ();
    }

}

export default IgnitionDb;