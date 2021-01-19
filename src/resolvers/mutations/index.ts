import     signUp       from    "./signUp";
import     uploadBook   from    "./uploadBook";
import     logIn        from    "./logIn";

const  Mutation = {
    // sign up to the site 
    signUp,
    
    logIn, 

    //disable User
    disableUser: ()=>{
        return false;
    },
    
    // upload a new Book
    uploadBook,

    // disable one or more pages
    disablePages: ()=>{
        return false;
    },

    // set a new book cover
    setBookCover: ()=>{
        return false;
    },

    // save last changes of a page
    editPage: ()=>{
        return false;
    },
};

export default Mutation;