import validator from 'validator';
import { UserModel } from '../model/user.js';

export const validateSignupData = async (req) => {
    const {emailId, password , name, role} = req.body;

    if(!emailId || !password || !name || !role) {
        throw new Error("All fields are required");
    }
    
    else if(!validator.isEmail(emailId)) {
        throw new Error("Invalid email format");
    }   
    else if(!validator.isStrongPassword(password)) {
        throw new Error("Password must be at least 8 characters long, include uppercase, lowercase, number, special character, and no spaces.");
    }
    
    const checkEmail = await UserModel.findOne({emailId : emailId});
    if(checkEmail) {
        throw new Error ("User exists Please login");
    }

}