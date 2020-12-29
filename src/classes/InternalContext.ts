import DataSources from "../datasources/DataSources";
import Authorizer  from "./Authorizer";

interface InternalContext 
{
    dataSources: DataSources
    authorizer:  Authorizer
}


export default InternalContext;