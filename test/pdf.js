const { PDFDocument }   =     require( "pdf-lib" );
const fs                =     require( "fs" );
const zlib              =     require( "zlib" );

const test = async ( filePath, newFilePath ) => {

    try
    {
        const buffer = fs.readFileSync( filePath );

        const doc = await PDFDocument.load( buffer );

        const newDoc = await PDFDocument.create( );

        const [ page ]= await newDoc.copyPages( doc, [ 0 ] );

        newDoc.addPage( page );

        const data = await newDoc.save( );

        console.info( data.byteLength , data.byteOffset );

        const zippedData = zlib.gzipSync( data );

        console.info( zippedData.byteLength, zippedData.byteOffset );

        const zippedData2 = zlib.deflateSync( data );

        console.info( zippedData2.byteLength, zippedData2.byteOffset );

        const zippedData3 = zlib.brotliCompressSync( data );

        console.info( zippedData3.byteLength, zippedData3.byteOffset );

        const unzippedData = zlib.brotliDecompressSync( zippedData3 );

        fs.writeFileSync( newFilePath, unzippedData );

        console.info( "done!" );
    }
    catch( err )
    {
        console.error( "error: ", err);
    }
}

const filePath = "/home/rseusebio/Downloads/Books/apollo.pdf";
const newfilePath = `/home/rseusebio/Downloads/Books/apollo_0.pdf`;

test( filePath, newfilePath );