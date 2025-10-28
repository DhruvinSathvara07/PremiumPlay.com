import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {Like} from "../models/like.model.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"

const createTweet = async (req, res) => {
    try {
        const {content} = req.body

        if (!content?.trim()) {
            throw new ApiError(400, "Tweet content is required!")
        }

        const tweet = await Tweet.create({
            content,
            owner: req.user._id
        })

        const createdTweet = await Tweet.findById(tweet._id).populate("owner", "fullName userName avatar")

        return res.status(201).json(
            new ApiResponse(201, createdTweet, "Tweet created successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to create tweet!")
    }
}

const getUserTweets = async (req, res) => {
    try {
        const {userId} = req.params

        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID!")
        }

        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found!")
        }

        const tweets = await Tweet.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(userId) } },
            { $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { fullName: 1, userName: 1, avatar: 1 } }
                ]
            }},
            { $addFields: { owner: { $first: "$owner" } } },
            { $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }},
            { $addFields: {
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }},
            { $project: { likes: 0 } },
            { $sort: { createdAt: -1 } }
        ])

        return res.status(200).json(
            new ApiResponse(200, tweets, "Tweets fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to fetch tweets!")
    }
}

const updateTweet = async (req, res) => {
    try {
        const {tweetId} = req.params
        const {content} = req.body

        if (!content?.trim()) {
            throw new ApiError(400, "Tweet content is required!")
        }

        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid tweet ID!")
        }

        const tweet = await Tweet.findById(tweetId)
        if (!tweet) {
            throw new ApiError(404, "Tweet not found!")
        }

        if (tweet.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You don't have permission to update this tweet!")
        }

        tweet.content = content
        await tweet.save()

        const updatedTweet = await Tweet.findById(tweet._id).populate("owner", "fullName userName avatar")

        return res.status(200).json(
            new ApiResponse(200, updatedTweet, "Tweet updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to update tweet!")
    }
}

const deleteTweet = async (req, res) => {
    try {
        const {tweetId} = req.params

        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid tweet ID!")
        }

        const tweet = await Tweet.findById(tweetId)
        if (!tweet) {
            throw new ApiError(404, "Tweet not found!")
        }

        if (tweet.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You don't have permission to delete this tweet!")
        }

        await Like.deleteMany({ tweet: tweetId })
        await Tweet.findByIdAndDelete(tweetId)

        return res.status(200).json(
            new ApiResponse(200, {}, "Tweet deleted successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to delete tweet!")
    }
}

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}