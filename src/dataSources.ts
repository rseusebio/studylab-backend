import { ignitionDb, cache } from "./datasources";

const dataSources = () => {
    
    const sources =   {
        ignitionDb, 
        cache
    };  

    return sources;
}

export default dataSources;