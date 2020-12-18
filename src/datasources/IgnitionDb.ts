import { DataSource }                              from 'apollo-datasource';
import config                                      from 'config';
import MongoConfig                                 from '../classes/config/MongoConfig';
import mongodb, { MongoClient, 
                  GridFSBucket, 
                  MongoClientOptions, 
                  GridFSBucketOptions}             from 'mongodb';
import util                                        from 'util';
import stream                                      from 'stream';
import path                                        from 'path';
import fs                                          from 'fs';
import { UserRecord }                              from '../classes/mutations/UserCreation';
import { BookRecord }                              from '../classes/mutations/BookUpload';

const pipelinePromise = util.promisify (stream.pipeline);

class IgnitionDb extends DataSource
{
    private     client:      MongoClient;
    private     mongoConfig: MongoConfig;
    private     error:       string;
    private     isConnected: boolean;

    constructor ()
    {
        super ();

        this.mongoConfig = config.get<MongoConfig> ("MongoDb");

        const clientOpts: MongoClientOptions =
        {
            useNewUrlParser:     true,
            useUnifiedTopology:  true,
            poolSize:            100,
            connectTimeoutMS:    99999,
            keepAlive:           true,
            connectWithNoPrimary: true
        }

        this.client      = new mongodb.MongoClient (this.retreiveURI (), clientOpts);

        this.error       = ""; 

        this.isConnected = false;
    }

    retreiveURI ()
    {
        const {User, Password, Host, DbName} = this.mongoConfig;

        const URI = `mongodb+srv://${User}:${Password}@${Host}/${DbName}?retryWrites=true&w=majority`;

        return URI;
    }

    async isClientConnected ()
    {
        if (!this.isConnected)
        {
            this.client.setMaxListeners (200);
            try
            {
                await this.client.connect ();

                this.isConnected = true;

                return true;
            }
            catch (err)
            {
                console.info ("connection error: ", err);

                return false;
            }
        }

        return true;
    }

    async saveFile (filePath: string, chunkSize: number): Promise<boolean>
    {
        const isConnected = await this.isClientConnected ();

        if (!isConnected)
        {
            return false;
        }

        const { DbName } = this.mongoConfig;

        const bucketOps: GridFSBucketOptions = { 
            chunkSizeBytes: chunkSize,
            bucketName:     "Pages"
        }

        const bucket = new GridFSBucket (this.client.db (DbName), bucketOps);

        const fileName = path.basename (filePath);

        try
        {
            await pipelinePromise (fs.createReadStream (filePath), bucket.openUploadStream (fileName));
        }
        catch (err)
        {
            this.error = err + "";

            console.info ("file upload error: ", err);

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

    async getBookPage (bookId: string, page: number, tmpDir: string): Promise<boolean>
    {
        const isConnected = await this.isClientConnected ();

        if (!isConnected)
        {
            return false;
        }

        const { DbName } = this.mongoConfig;

        const bucketOps: GridFSBucketOptions = { 
            bucketName:     "Pages"
        }

        const fileName = `${bookId}_${page}.pdf`;

        const pagePath = path.join (tmpDir, fileName);

        const bucket = new GridFSBucket (this.client.db (DbName), bucketOps);

        try
        {
            await pipelinePromise (bucket.openDownloadStreamByName (fileName), fs.createWriteStream (pagePath));
        }
        catch (err)
        {
            this.error = err + "";

            console.info ("file upload error: ", err);

            return false;
        }

        return true;
    }

}

export default IgnitionDb;