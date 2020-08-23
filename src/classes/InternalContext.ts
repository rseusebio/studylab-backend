import DataSources from "../datasources/DataSources";
import Authorizer  from "./Authorizer";

class InternalContext 
{
    dataSources: DataSources
    authorizer:  Authorizer
}


export default InternalContext;