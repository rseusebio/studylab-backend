import InternalContext from "../../classes/InternalContext";

const healthCheck = async (_, __, context) => {

    let startTime = new Date ().valueOf ();
    
    const { dataSources, authorizer }  = (context as InternalContext)

    await authorizer.validateUser (dataSources.ignitionDb);

    const { Authorized, Error} = authorizer;

    return {
        Authorized, 
        Error,
        ElapsedTime: (Date.now () - startTime) / 1000
    }
}

export default healthCheck;