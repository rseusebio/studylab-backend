import { DataSource } from "apollo-datasource";
import { CacheManager } from "../datasources/cache";
import { IgnitionDb } from "../datasources/IgnitionDb";

class DataSources
{
    ignitionDb:     IgnitionDb;
    cache:          CacheManager;
}

export default DataSources;

