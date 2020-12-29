import IgnitionDb from "./datasources/IgnitionDb";

const dataSources = () => {
    return  {
        ignitionDb: new IgnitionDb()
    };  
}

export default dataSources;