import      { CacheManager }    from    "../datasources/cache";
import      { IgnitionDb }      from    "../datasources/IgnitionDb";

interface IDataSources
{
    ignitionDb:     IgnitionDb;
    cache:          CacheManager;
};

export default IDataSources;


