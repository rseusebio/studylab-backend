import { gql } from 'apollo-server';

//#region ============= OBJECT DEFITIONS    ============
const User = `
type User
{
    id:             ID!
    username:       String!
    email:          String!
    emailStatus:    Int
    accountStatus:  Int
    creationDate:   String
}`;

const BookType = `
enum BookType
{
    PDF
}`;

const Book = `
type Book
{
    id:              ID!
    userId:          ID!
    title:           String!
    type:            BookType!
    size:            Float
    uploadDate:      String!
    coverPageLink:   String
}`;

const Page = `
type Page 
{
    id:           ID!
    number:       Int!
    bookId:       ID!
    isEnabled:    Boolean!
}`;

const Coordinate = `
type Coordinate
{
    x:  Float!
    y:  Float!
}`;

const Highlight = `
type Highlight 
{
    id:          ID!
    pageID:      ID!
    height:      Float!
    width:       Float!
    coords:      Coordinate!
    pageHeight:  Float!
    pageWidth:   Float!
}`;

const BookOrder = `
enum BookOrder
{
    ASC, 
    DESC
}`;

const ObjectDefinitions = User + BookType + Book + Page + Coordinate + Highlight + BookOrder;
//#endregion

//#region ============= QUERY RESPONSES     ============
const ListBooksResponse = ` 
type ListBooksResponse
{
    authorized:     Boolean
    succeeded:      Boolean
    error:          String
    elapsedTime:    Float
    
    books:          [Book]
}`;

const QueryResponses = ListBooksResponse;
//#endregion

//#region ============= MUTATION RESPONSES  ============
const SignInResponse = `
type SignInResponse
{
    statusCode:   Int!
    user:         User
    elapsedTime:  Float
}`;

const LogResponse = `
type LogResponse
{   
    statusCode:  String
    elapsedTime: Float
}`;


const UploadBookResponse = `
type UploadBookResponse 
{
    filename:      String
    size:          Float
    type:          String
    encoding:      String

    statusCode:    Int
    elapsedTime:   Float

    uploadDate:    String
}`;

const MutationResponses = SignInResponse + LogResponse + UploadBookResponse;
//#endregion

const Query = `
type Query 
{
    listBooks( limit: Int, order: BookOrder ): ListBooksResponse!

    page: Boolean

    smallPages: Boolean

    pageEditions: Boolean
}`;

const Mutation = `
type Mutation 
{
    signIn( username: String!, email: String!, password: String! ): SignInResponse!

    logIn: LogResponse!

    logOut: LogResponse!

    disableUser:  Boolean

    uploadBook( file: Upload! ): UploadBookResponse!
    
    disablePages: Boolean
    setBookCover: Boolean
    editPage:     Boolean

}`;

const typeDefs = gql`

    ${ObjectDefinitions}

    ${QueryResponses}

    ${Query}

    ${MutationResponses}

    ${Mutation}
`;

 export default typeDefs;