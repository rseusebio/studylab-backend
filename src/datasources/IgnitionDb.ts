import      { DataSource }                              from 'apollo-datasource';
import      config                                      from 'config';
import      MongoConfig                                 from '../classes/config/MongoConfig';
import      mongodb, { MongoClient, 
                       GridFSBucket, 
                       MongoClientOptions, 
                       GridFSBucketOptions }            from "mongodb";
import      util                                        from "util";
import      stream                                      from "stream";
import      path                                        from "path";
import      fs                                          from "fs";
import      { UserRecord }                              from "../classes/mutations/signIn";
import      { StatusCode }                              from "../classes/Status";
import      { PageRecord,
              BookRecord }                              from '../classes/mutations/uploadBook';

const pipelinePromise = util.promisify( stream.pipeline );

class IgnitionDb extends DataSource
{
    private     client:           MongoClient;
    private     mongoConfig:      MongoConfig;
    public      statusCode:       StatusCode;
    private     isConnected:      boolean;
    

    private     usersColl:        mongodb.Collection<UserRecord>

    constructor( )
    {
        super( );

        console.info( "Ignition database has been instanciated", new Date().toISOString() );

        this.mongoConfig = config.get<MongoConfig>( "MongoDb" );

        const clientOpts: MongoClientOptions =
        {
            useNewUrlParser:     true,
            useUnifiedTopology:  true,
            poolSize:            100,
            connectTimeoutMS:    99999,
            keepAlive:           true,
            connectWithNoPrimary: true
        }

        this.client      =  new mongodb.MongoClient( this.getURI( ), clientOpts );
        this.isConnected =  false;
    }

    getURI(): string
    {
        const {User, Password, Host, DbName} = this.mongoConfig;

        const URI = `mongodb+srv://${User}:${Password}@${Host}/${DbName}?retryWrites=true&w=majority`;

        return URI;
    }

    async connect(): Promise<boolean>
    {
        if ( this.client.isConnected( { returnNonCachedInstance: true } ) )
        {
            return true;
        }

        this.client.setMaxListeners( 200 );

        try
        {
            await this.client.connect( );

            return true;
        }
        catch( err )
        {
            console.error( "connection error: ", err );

            return false;
        }
    }

    // This should be called after all queries and mutations have been executed
    async close()
    {
        await this.client.close();
    }

    async usersCollection( ):  Promise<void>
    {
        if ( !await this.connect() )
        {
            this. statusCode = StatusCode.DATABASE_NOT_CONNECTED;

            return;
        }

        if ( !this.usersColl )
        {
            const { DbName, UserCollection } = this.mongoConfig;

            const db = this.client.db( DbName );

            this.usersColl =  db.collection<UserRecord>( UserCollection );
        }
    }

    //#region ================ USER QUERIES ==============
    async findUser( username: string, email: string = "" ): Promise<UserRecord | null>
    {        
        await this.usersCollection();

        if( !this.usersColl )
        {
            return;
        }

        const user = await this.usersColl.findOne<UserRecord>( { "$or":[ {"username": username}, { "email": email} ] } );
  
        return user;
    }

    async insertNewUser( username:string, email: string,  pwd: string ): Promise<UserRecord | null>
    {        
        if ( !await this.connect() )
        {
            this.statusCode = StatusCode.DATABASE_NOT_CONNECTED;

            return null;
        }

        const { DbName, UserCollection } = this.mongoConfig;

        const db = this.client.db( DbName );

        const userColl = db.collection<UserRecord>( UserCollection );

        const user = new UserRecord( username, email, pwd );
        
        const { insertedCount } = await userColl.insertOne( user );

        if (insertedCount == 1)
        {
            return user
        }
        
        return null;
    }

    async logInUser( username: string ): Promise<boolean>
    {
        await this.usersCollection( );

        if( !this.usersColl )
        {
            return;
        }

        const updateRes = await this.usersColl.updateOne( { username }, { "$set": { isLogged: true, lastLoginDate: new Date( ) }} );

        if( !updateRes?.result?.nModified || updateRes?.result?.nModified < 1 )
        {
            return;
        }
        
        return true;
    }

    async logOutUser( username: string ): Promise<boolean>
    {
        await this.usersCollection( );

        if( !this.usersColl )
        {
            return;
        }

        const updateRes = await this.usersColl.updateOne( { username }, { "$set": { isLogged: false }} );

        if( !updateRes?.result?.nModified || updateRes?.result?.nModified < 1 )
        {
            return;
        }
        util
        return true;
    }
    //#endregion

    //#region ================ BOOK QUERIES ==============

    async uploadBookRecord( username: string, bookId: string, title: string, totalPages: number, byteLength: number )
    {
        if ( !await this.connect() )
        {
            this.statusCode = StatusCode.DATABASE_NOT_CONNECTED;

            return null;
        }

        const { DbName, BookCollection } = this.mongoConfig;

        const db = this.client.db( DbName );

        const book = new BookRecord( username, bookId, title, totalPages, byteLength );

        const bookColl = db.collection<BookRecord>( BookCollection );
        
        const { insertedCount } = await bookColl.insertOne( book );

        if (insertedCount == 1)
        {
            return book
        }
        
        return null;
    }

    async uploadPageRecord( data: string, username: string, bookId: string, pageIndex: number )
    {
        if ( !await this.connect() )
        {
            this.statusCode = StatusCode.DATABASE_NOT_CONNECTED;

            return null;
        }

        const { DbName, PageCollection } = this.mongoConfig;

        const db = this.client.db( DbName );

        const page = new PageRecord( username, bookId, pageIndex, data );

        const pageColl = db.collection<PageRecord>( PageCollection );
        
        const { insertedCount } = await pageColl.insertOne( page );

        if (insertedCount == 1)
        {
            return page
        }
        
        return null;
    }

    async uploadFile( filePath: string, chunkSize: number ): Promise<boolean>
    {
        if ( !await this.connect() )
        {
            return false;
        }

        const { DbName, PageBucket } = this.mongoConfig;

        const bucketOps: GridFSBucketOptions = { 
            chunkSizeBytes: chunkSize,
            bucketName:     PageBucket
        }

        const bucket = new GridFSBucket( this.client.db( DbName ), bucketOps );

        const fileName = path.basename( filePath );

        try
        {
            await pipelinePromise( fs.createReadStream( filePath ), bucket.openUploadStream( fileName ) );

            return true;
        }
        catch (err)
        {
            this.statusCode = StatusCode.FILE_UPLOAD_FAILED;

            console.info ("file upload error: ", err);

            return false;
        }
    }

    async insertBookRecord( login: string, bookId: string, fileName: string, uploadDate: Date ): Promise<boolean>
    {
        if (await this.connect () == false)
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

    async removeBookRecord( bookId: string ): Promise<boolean>
    {
        if (await this.connect () == false)
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

    async getUserBooks( login: string, sizeLimit: number = 10 ): Promise<Array<BookRecord>>
    {
        let books = new Array<BookRecord> ();

        if (await this.connect () == false)
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

    async getBookPage( bookId: string, page: number, tmpDir: string ): Promise<boolean>
    {
        const isConnected = await this.connect ();

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
            this.statusCode = StatusCode.PAGE_DOWNLOAD_FAILED;

            console.info ("file upload error: ", err);

            return false;
        }

        return true;
    }
    //#endregion

    
}

export default IgnitionDb;