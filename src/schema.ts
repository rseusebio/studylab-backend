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
    UserName:   String
    Error:      String
    Authorized: Boolean!
}`;

const Query = `
type Query {
    health_check: LoginResponse!

    bookCovers: Boolean
    bookInfo: Boolean
    page: Boolean
    smallPages: Boolean
    pageEditions: Boolean
}`;

const UPLOAD_RESPONSE = `
type UploadResponse 
{
    FileName:   String
    Uploaded:   Boolean
    Size:       Float
    Type:       String
    Enconding:  String
    Error:      String
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
    ${Query}
    ${UPLOAD_RESPONSE}
    ${UserCreationResponse}
    ${Mutation}
`;

export default typeDefs;