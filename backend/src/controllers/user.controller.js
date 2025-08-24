import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try{
        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false}); // basically when you are saving it, the user schema gets invoked, and that schema has some required field such as password! to avoid that we pass {validateBeforeSave: false}

        return {accessToken, refreshToken};

    } catch(error){
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
}

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
        const {fullName, email, username, password} = req.body;
        // console.log("\nuser.controller.js :: \n", req.body);

        // Validation
        // if(fullname===""){
        //     throw new ApiError(400, "fullname is required")
        // }
        if(
            [fullName, email, username, password].some((field)=>field?.trim()==="")
        ){
            throw new ApiError(400, "All fields are required");
        }

        // Check if user exists
        const existedUser = await User.findOne({
            $or: [{username}, {email}]
        })

        if(existedUser){
            throw new ApiError(409, "User with email or username already exits");
        }

        // image
        const avatarLocalpath = req.files?.avatar[0]?.path;
        // const coverImageLocalPath = req.files?.coverImage[0]?.path;

        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
            coverImageLocalPath = req.files.coverImage[0].path;
        }


        // console.log("\nuser.contorller.js :: \n", req.files);

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
            fullName,
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
);


const loginUser = asyncHandler(async(req, res)=>{
    // todos---
    // req body -> data
    // username or email
    // find the user
    // if user is there, password check
    // access and refresh token
    // send cookie

    const {email, username, password} = req.body;
    if(!(username || email)){
        throw new ApiError(400, "username or email is requried");
    }

    const user = await User.findOne({
        $or: [{username}, {email}],
    });

    if(!user){
        throw new ApiError(404, "User does not exist");
    }

    const isPassWordValid = await user.isPasswordCorrect(password);

    if(!isPassWordValid){
        throw new ApiError(401, "Invalid user Credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    //now I have to decide in this case updating the object is easier or fetching from database (the updated object) is easier (easier in terms of cost)
    //in this project : this case I think fetching is okay.
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken"); //it selects the fields except for the mentioned ones.

    // it secures the cookies so that cannot be modified from the fron-end.
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    user: loggedInUser, accessToken, refreshToken,
                },
                "User logged In Successfully"
            )
        )


});

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 //this removes the field from document
            }
        },
        {
            new: true
        },
    );

    const options = {
        httpOnly: true,
        secure: true,
    }
    
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged out!!!"));
});


const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used");
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed!!!"
                )
            )
    } catch (error) {
        throw new ApiError(401, error.message || "invalid refresh token");
    }

});


export {registerUser, loginUser, logoutUser, refreshAccessToken};


