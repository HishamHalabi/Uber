import { fileTypeFromBuffer } from "file-type";
import fs from "fs";


export const fileValidation = (allowed  = [])=>{ 
   return  async (req, res, next) => {
                    const filePath = req.file.path;
                    const buffer = fs.readFileSync(filePath);
                    const type = await fileTypeFromBuffer(buffer);
                    const allowedTypes = allowed;
                    if (!type || !allowedTypes.includes(type.mime))
                    {
                         fs.unlinkSync(filePath);
                         throw new BadRequrest("invalid file type") ;
                    }
                    return next();
             
            
  }
};