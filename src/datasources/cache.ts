import      NodeCache           from    "node-cache";
import      config              from    "config";
import      CacheConfig         from    "../classes/config/CacheConfig";
import      { UserRecord }      from    "../classes/mutations/signUp";
import      { DataSource }      from    "apollo-datasource";

const cacheConfig = config.get<CacheConfig>( "Cache" );

class CacheManager extends DataSource
{   
    private cache: NodeCache;

    constructor( )
    {
        super();

        this.cache = new NodeCache( { ...cacheConfig } );
    }

    userKey( username: string, password: string, email: string ): string
    {
        return username + "::" + password + "::" + email;
    }

    cacheUser( user: UserRecord ): boolean
    {
        const { username , password, email } = user;

        const key = this.userKey( username , password, email );

        try
        {
            return this.cache.set( key, user );
        }
        catch( err )
        {
            return false;
        }
    }

    getUser( key: string )
    {
        try 
        {
            return this.cache.get<UserRecord>( key );
        }
        catch( err )
        {
            return null;
        }
    }
}

const cache = new CacheManager( );

export default cache;

export {
    CacheManager
}
