const { where } = require("sequelize");

//it make changing DB used easier 
export class DBrepository  { 
     model   ; 
     constructor (model)  { 
        this.model = model; 
     }

     async  Create(data){ 
        return await this.model.Create(data) ; 
     }

     async  Find(condition){ 
        return await this.model.findAll({where  :  condition} ) ; 
     }

     async Update(condition) { 
          return await this.model.update(data ,  {where : condition}) ; 
     }

     async Delete(condition)  { 
         return await this.model.destroy({where  : condition}) ;
     }

};