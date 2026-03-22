

//it make changing DB used easier 
export class DBrepository  { 
     model   ; 
     constructor (model)  { 
        this.model = model; 
     }

     async  Create(data){ 
        return await this.model.create(data) ; 
     }

     async  Find(condition){ 
        return await this.model.findAll({where  :  condition} ) ; 
     }

     async  FindWithPop(condition , populate){ 
        return await this.model.findAll({where  :  condition , include : populate} ) ; 
     }
     async  FindOne(condition){ 
        return await this.model.findOne({where  :  condition} ) ; 
     }

      async  FindOneWithPop(condition , populate){ 
        return await this.model.findOne({where  :  condition , include : populate} ) ; 
     }

     async Update(condition ,  data) { 
      console.log(condition , data)
          return await this.model.update(data , {where : condition}  ) ; 
     }

     async Delete(condition)  { 
         return await this.model.destroy({where  : condition}) ;
     }

};