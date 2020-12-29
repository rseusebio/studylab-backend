const parseCookie = (cookie: string) => {

    const cookies = cookie.split(";");

    const cookieJSON = {};

    for( let cookie of cookies )
    {
        const [prop, value] = cookie.split( "=" );

        cookieJSON[prop] = value;
    }

    return cookieJSON;
}

export{
    parseCookie
}