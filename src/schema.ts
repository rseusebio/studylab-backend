import { gql } from 'apollo-server'

const USER = `
type User{
    id:       ID
    Name:     String
    Password: String
    Enabled:  String
}`;

const BOOK = `
type Book{
    id:       ID!
    Title:    String!
    Author:   Author
    Category: Category
}`;

const AUTHOR = `
type Author
{
    id:   ID!
    Name: String!
}`;

const CATEGORY = `
type Category{
    id:   ID!
    Name: String!
}`;

const PAGE = `
type Page {
    id:       ID!
    Number:   Int!
    Book:     Book!
    Enabled:  Boolean!
}`;

const MARKUP = `
type MarkUp {
    id:         ID!
    Page:       Page!
    Height:     Float!
    Width:      Float!
    X:          Float!
    Y:          Float!
    PageHeight: Float!
    PageWidth:  Float!
}`;

const LoginResponse = `
type LoginResponse
{
    Error:       String
    Authorized:  Boolean!
    ElapsedTime: Float
}`;

const BookRecord = `
type BookRecord 
{
    Id:         String
    Title:      String
    UploadDate: String
}
`

const BooksResponse = ` 
type BooksResponse
{
    Authorized: Boolean
    Error:      String
    Books:      [BookRecord]
}
`

const Query = `
type Query {
    healthCheck: LoginResponse!

    getBooks (limit: Int): BooksResponse!
    bookCovers: Boolean
    bookInfo: Boolean
    page: Boolean
    smallPages: Boolean
    pageEditions: Boolean
}`;

const UPLOAD_RESPONSE = `
type UploadResponse 
{
    FileName:    String
    Uploaded:    Boolean
    Size:        Float
    Type:        String
    Enconding:   String

    Authorized:  Boolean
    Error:       String
}`;

//#region  Mutation Definitions
const UserCreationResponse = `
type UserCreationResponse
{
    Success: Boolean!
    Error:   String
}`;
//#endregion


const Mutation = `
type Mutation {
    bookUpload (file: Upload!): UploadResponse!
    createUser (login: String!, password: String!): UserCreationResponse!
    
    disableUser:  Boolean
    disablePages: Boolean
    setBookCover: Boolean
    editPage:     Boolean

}`;

const typeDefs = gql`

    ${USER}
    ${BOOK}
    ${AUTHOR}
    ${CATEGORY}
    ${PAGE}
    ${MARKUP}
    ${LoginResponse}

    ${BookRecord}
    ${BooksResponse}

    ${Query}

    ${UPLOAD_RESPONSE}
    ${UserCreationResponse}

    ${Mutation}
`;

export default typeDefs;