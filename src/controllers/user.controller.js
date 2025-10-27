import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token !")
    }
}

// Register users
const registerUser = async (req, res) => {
    try {
        const { userName, email, fullName, password } = req.body;

        if ([fullName, email, userName, password].some((field) => !field?.trim())) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        const existedUser = await User.findOne({
            $or: [{ userName }, { email }],
        });

        if (existedUser) {
            return res.status(409).json({ message: "User with this email or username already exists!" });
        }

        console.log("Files received:", req.files);

        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

        if (!avatarLocalPath) {
            return res.status(400).json({ message: "Avatar file is required!" });
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

        // Cleanup files
        try {
            if (fs.existsSync(avatarLocalPath)) fs.unlinkSync(avatarLocalPath);
            if (coverImageLocalPath && fs.existsSync(coverImageLocalPath)) fs.unlinkSync(coverImageLocalPath);
        } catch (cleanupErr) {
            console.warn("File cleanup warning:", cleanupErr.message);
        }

        if (!avatar?.url) {
            return res.status(400).json({ message: "Avatar upload failed!" });
        }

        const user = await User.create({
            fullName,
            userName: userName.toLowerCase(),
            email,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
        });

        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        return res.status(201).json({ data: createdUser, message: "User created successfully!" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error!", error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { userName, email, password } = req.body;

        if (!userName && !email) {
            throw new ApiError(400, "UserName is required !");
        }

        const user = await User.findOne({
            $or: [{ userName }, { email }]
        });

        if (!user) {
            throw new ApiError(404, "User Does not exist !");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user credntails !");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200,
                    { user: loggedInUser, accessToken, refreshToken },
                    "User Logged In Successfully !"
                )
            )
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error!", error: error.message });
    }
};

const logoutUser = async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken: undefined
                }
            },
            {
                new: true
            }
        )

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options)
            .json(
                new ApiResponse(200, {}, "User Logged Out !")
            )
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error!", error: error.message });
    }
}

const refreshAccessToken = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token !");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used !")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options).json(
            new ApiResponse(200, { accessToken, newRefreshToken },
                "Access Token refreshed !"
            )
        )

    } catch (error) {
        throw new ApiError(401, error?.message, "Invalid refresh Token !");
    }
}

const changeCurrentPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(req.user?._id);
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isPasswordCorrect) {
            throw new ApiError(400, "Invalid Old Password !");
        }

        user.password = newPassword;
        await user.save({ validateBeforeSave: false })

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "Password Changed Successfully !")
            )
    } catch (error) {
        throw new ApiError(401, error?.message, "Invalid refresh Token !");
    }
}

const getCurrentUser = async (req, res) => {
    try {
        return res.status(200).json(
            new ApiResponse(200, req.user, "Current User fetched Successfully !")
        );
    } catch (error) {
        throw new ApiError(401, error?.message, "Invalid refresh Token !");
    }
}

const updateAccountDetails = async (req, res) => {
    try {
        const { fullName, email } = req.body

        if (!fullName || !email) {
            throw new ApiError(400, "All Fields are required !");
        }

        const updatedUser = await User.findByIdAndUpdate(req.user?._id,
            {
                $set: {
                    fullName, email
                }
            },
            { new: true }
        ).select("-password")

        return res.status(200).json(
            new ApiResponse(200, updatedUser, "Account Details Updated Successfully !")
        )
    } catch (error) {
        throw new ApiError(401, error?.message, "Invalid refresh Token !");
    }
}


const updateUserAvatarImage = async (req, res) => {
    try {
        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is missing!");
        }

        const user = await User.findById(req.user?._id);
        if (!user) {
            throw new ApiError(404, "User not found!");
        }

        if (user.avatar) {
            await deleteFromCloudinary(user.avatar);
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar?.url) {
            throw new ApiError(400, "Error while uploading new avatar!");
        }

        user.avatar = avatar.url;
        await user.save({ validateBeforeSave: false });

        return res.status(200).json(
            new ApiResponse(200, user, "Avatar image updated successfully!")
        );
    } catch (error) {
        throw new ApiError(500, error?.message || "Error updating avatar!");
    }
};

const updateUserCoverImage = async (req, res) => {
    try {
        const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
        if (!coverImageLocalPath) {
            throw new ApiError(400, "Cover image file is missing!");
        }

        const user = await User.findById(req.user?._id);
        if (!user) {
            throw new ApiError(404, "User not found!");
        }

        if (user.coverImage) {
            await deleteFromCloudinary(user.coverImage);
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
        if (!coverImage?.url) {
            throw new ApiError(400, "Error while uploading cover image!");
        }

        user.coverImage = coverImage.url;
        await user.save({ validateBeforeSave: false });

        return res.status(200).json(
            new ApiResponse(200, user, "Cover image updated successfully!")
        );
    } catch (error) {
        throw new ApiError(500, error?.message || "Error updating cover image!");
    }
};

const getUserChannelProfile = async (req, res) => {
    try {
        const { username } = req.params;
        console.log("Searching channel for:", username);

        if (!username?.trim()) {
            throw new ApiError(400, "Username is missing!");
        }

        const channel = await User.aggregate([
            {
                $match: { userName: username }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: { $size: "$subscribers" },
                    channelsSubscribedToCount: { $size: "$subscribedTo" },
                    isSubscribed: {
                        $cond: {
                            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    fullName: 1,
                    userName: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1
                }
            }
        ]);

        if (!channel?.length) {
            throw new ApiError(404, "Channel does not exist!");
        }

        return res.status(200).json(
            new ApiResponse(200, channel[0], "User Channel fetched successfully!")
        );

    } catch (error) {
        console.error("Error in getUserChannelProfile:", error.message);
        return res.status(500).json(
            new ApiResponse(500, {}, error?.message || "Error fetching channel!")
        );
    }
};

const getWatchHistory = async (req, res) => {
    try {
        const user = await User.aggregate(
            [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(req.user._id)
                    }
                },
                {
                    $lookup: {
                        from: "videos",
                        localField: "watchHistory",
                        foreignField: "_id",
                        as: "watchHistory",
                        pipeline: [
                            {
                                $lookup: {
                                    from: "users",
                                    localField: "owner",
                                    foreignField: "_id",
                                    as: "owner",
                                    pipeline: [
                                        {
                                            $project: {
                                                fullName: 1,
                                                username: 1,
                                                avatar: 1
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                $addFields: {
                                    owner: {
                                        $first: "$owner"
                                    }
                                }
                            }
                        ]
                    }
                }
            ]
        )

        return res.status(200).json(
            new ApiResponse(200, user[0].watchHistory, "Watch History Fetched Successfully !")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Error !");
    }
}

export default {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatarImage,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};