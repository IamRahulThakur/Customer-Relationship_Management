import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { UserModel } from "../model/user.js";
import { configDotenv } from "dotenv";

configDotenv();


export const userAuth =async (req, res, next) => {

  try {
    // Read Token From Cookies
    const token = req.cookies.token;

    // Validate Token 
    if (!token) {
      throw new Error("Please login.....")
    }
    
    // Decoded return a object contain {paylod , iat(issued at time)}
    // In our case payload was {userId: user._id} 
    const decoded = jwt.verify(token , process.env.JWT_SECRET);
    // So here we are taking userId from decoded Object
    const userId = decoded.userId;

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new Error("User not Found...");
    }
    req.user = user;
    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    res.status(400).send({error: error.message});
  }
};
