import bcrypt  from "bcryptjs";
import crypto from "crypto" 


const salt =5;
export async  function  hash(data )  { 
    return await  bcrypt.hash(data ,  salt); 
}

export async function comp(data , hashed) {
    return await bcrypt.compare(data ,  hashed)  ; 
}


const algo = process.env.algo , key = process.env.key , iv = process.env.iv;
//these actions are sync
export function encrypt(text) {
    console.log(text) ; 
    const cipher = crypto.createCipheriv(algo, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
}

export function decrypt(encrypted) {
    console.log(encrypted);
    const decipher = crypto.createDecipheriv(algo, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

