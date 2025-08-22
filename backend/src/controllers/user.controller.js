import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const registerUser = asyncHandler(
    async(req, res) => {
        // get user details from frontend
        // validation - not empty
        // check if user already exists: username, email
        // check for images, check for avatar
        // upload them to cloudinary, check avatar again
        // create user object - create entry in db
        // remove password and refresh token field from response
        // check for user creation 
        // return response
        
        // user details from frontend
        const {fullname, email, username, password} = req.body;
        console.log("email: ", email);

        // Validation
        // if(fullname===""){
        //     throw new ApiError(400, "fullname is required")
        // }
        if(
            [fullname, email, username, password].some((field)=>field?.trim()==="")
        ){
            throw new ApiError(400, "All fields are required");
        }

        // Check if user exists
        const existedUser = User.findOne({
            $or: [{username}, {email}]
        })

        if(existedUser){
            throw new ApiError(409, "User with email or username already exits");
        }

        // image
        const avatarLocalpath = req.files?.avatar[0]?.path;
        const coverImageLocalPath = req.files?.coverImage[0]?.path;

        // check if avater exists now
        if(!avatarLocalpath){
            throw new ApiError(400, "Avatar file is required");
        }

        // upload them to cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalpath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        //check if avater was uploaded successfully
        if(!avatar){
            throw new ApiError(400, "Avatar file is required");
        }

        // create user object and post it in db
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase(),
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        if(!createdUser){
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        return res.status(201).json(
            new ApiResponse(201, createdUser, "User registered Successfully")
        );

    }
)

export {registerUser};


