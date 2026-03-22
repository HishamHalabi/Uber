
export class UnAuthorized extends Error  { 
     cause ; 
     constructor(msg)  { 
           super(msg) ; 
           this.cause =  401 ; 
     }
}

export class BadRequest extends Error  { 
     cause ; 
     constructor(msg)  { 
           super(msg) ; 
           this.cause =  400 ; 
     }
}


export class NotFound extends Error  { 
     cause ; 
     constructor(msg)  { 
           super(msg || "not found") ; 
           this.cause =  404 ; 
     }
}


export class Conflict extends Error  { 
     cause ; 
     constructor(msg)  { 
           super(msg || "conflict") ; 
           this.cause =  409 ; 
     }
}