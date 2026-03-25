import { deleteUser, getAllusers, updateData, updateProfilePic } from "../Services/user.service.js";

export async function getProfile(req,res,next) {
     const data =  req.driver || req.user   ; 
     return res.status(200).json({Message  : "success"    , success :  true , data}) ;  
}

export async function getAllusersC(req,res,next) {
     const data = await getAllusers(req.user) ; 
     return res.status(200).json({Message  : "success"    , success :  true , data}) ;  
}

export async function updateProfilePicC(req,res,next) {
     const data = await updateProfilePic(req.user.ID , req.file.path) ; 
     return res.status(200).json({Message  : "success"    , success :  true , data}) ;  
}

export async function updateDataC(req,res,next) {

     const data = await updateData(req.user.ID  , req.body) ; 
     return res.status(200).json({Message  : "updated success"    , success :  true }) ;  
}

export async function deleteUserC(req,res,next) {
     await deleteUser(req.user.ID) ; 
     return res.status(200).json({Message  : "deleted success"    , success :  true }) ;  
}