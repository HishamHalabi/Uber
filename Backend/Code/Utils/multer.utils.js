import multer from "multer";


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const id = req.user.ID  || req.driver.user_id ; 
    if (!fs.existsSync(`./Uploads/${id}`)){
        fs.mkdirSync(`./Uploads/${id}`) ;
    }
    cb(null, `Uploads/${id}`);
  },
  filename: function (req, file, cb) {
    const uniquePrefix= Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniquePrefix  + '_' +    file.originalname)
  }
})


export const fileUpload  =  (allowed   = ["image/jpeg" , "image/png"])=>{
    return  multer({
          storage , 
          limits  : {
           fileSize : 5000
          }
         ,fileFilter  :  (req,file , cb)=>{      
                 if(!allowed.includes(file.mimetype))  { 
                     cb(null  , false) ;    
                 }
                 cb(null , true) ;      
         }}) ; 
}