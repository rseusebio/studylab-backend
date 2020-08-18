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

const LOGIN_RESPONSE = `
type LoginResponse
{
    id:         ID
    Name:       String
    Password:   String
    Enabled:    String
    Authorized: Boolean!
}`;

const QUERY = `
type Query {
    health_check: LoginResponse!
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
const CreateUserResponse = `
type CreateUserResponse
{
    Success: Boolean!
    Error:   String
}`;
//#endregion


const Mutation = `
type Mutation {
    fileUpload (file: Upload!): UploadResponse!
    createUser (login: String!, password: String!): CreateUserResponse!
}`;

const typeDefs = gql`
    ${USER}
    ${BOOK}
    ${AUTHOR}
    ${CATEGORY}
    ${PAGE}
    ${MARKUP}
    ${LOGIN_RESPONSE}
    ${QUERY}
    ${UPLOAD_RESPONSE}
    ${CreateUserResponse}
    ${Mutation}
`;

export default typeDefs;