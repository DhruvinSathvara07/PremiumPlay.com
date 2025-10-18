import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";
import fs from "fs";
// import fs from "fs";

// Register users
const registerUser = asyncHandler(async (req, res) => {
    const { userName, email, fullName, password } = req.body;

    if ([fullName, email, userName, password].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required!");
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with this email or username already exists!");
    }

    console.log("Files received:", req.files);

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required!");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : null;

    try {
        if (fs.existsSync(avatarLocalPath)) fs.unlinkSync(avatarLocalPath);
        if (coverImageLocalPath && fs.existsSync(coverImageLocalPath))
            fs.unlinkSync(coverImageLocalPath);
    } catch (err) {
        console.warn("File cleanup warning:", err.message);
    }

    if (!avatar?.url) {
        throw new ApiError(400, "Avatar upload failed!");
    }

    const user = await User.create({
        fullName,
        userName: userName.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "User created successfully!"));
});

// const loginUser = asyncHandler(async (req, res) => {
//     const { userName, email, password } = req.body;

//     if (!userName || !email) {
//         throw new ApiError(400, "UserName is required !");
//     }

//     const user = await User.findOne({
//         $or: [{ userName }, { email }]
//     });

//     if (!user) {
//         throw new ApiError(404, "User Does not exist !");
//     }

//     const isPasswordValid = await user.isPasswordCorrect(password);

//     if (!isPasswordValid) {
//         throw new ApiError(401, "Invalid user credntails !");
//     }
// });

// const loginUser = asyncHandler(async (req, res) => {
//     const { userName, email, password } = req.body;

//     if (!userName || !email) {
//         throw new ApiError(400, "UserName is required !");
//     }

//     const user = await User.findOne({
//         $or: [{ userName }, { email }]
//     });

//     if (!user) {
//         throw new ApiError(404, "User Does not exist !");
//     }

//     const isPasswordValid = await user.isPasswordCorrect(password);

//     if (!isPasswordValid) {
//         throw new ApiError(401, "Invalid user credntails !");
//     }
// });


export default registerUser;
