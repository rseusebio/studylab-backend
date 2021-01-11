import NodeCache from "node-cache";


const opts: NodeCache.Options = {
    stdTTL: 60 * 60 * 24, // 24 hours, 
    checkperiod: 60 * 5 // 5 minutes
}

const cache = new NodeCache( opts );

cache.on( "set" , (key: string, value: any)=>{
    console.info( `${key} has been cached.` );
});

export default cache;