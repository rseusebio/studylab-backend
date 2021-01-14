const NodeCache = require( "node-cache" );

const opts = {
    sdtTTL: 0, 
    maxKeys: 5,
};

const cache = new NodeCache( opts );

const keys = [
    "key1", 
    "key2", 
    "key3", 
    "key4",
    "key5",
    "key6",
    "key7",
    "key8",
    "key9",
    "key10",
]

const test = () => {

    for ( let key of keys ) {
        
        const obj = {
            key, 
            value: Math.random( )
        }

        try
        {
            cache.set( key, obj );

            console.info( `@${key}: `, cache.keys( ) );
        }
        catch( err )
        {
            cache.flushAll( );

            console.info( "flushed: ", cache.keys( ) );
        }  
    }
}

test();