interface MongoConfig 
{
    User:            string;
    Password:        string;
    Host:            string;
    DbName:          string;
    UserCollection:  string;
    BookCollection:  string;
    PageCollection:  string;
    PageBucket:      string;
}

export default MongoConfig;