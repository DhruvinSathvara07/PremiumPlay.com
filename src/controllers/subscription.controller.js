import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"


const toggleSubscription = async (req, res) => {
    try {
        const {channelId} = req.params

        if (!isValidObjectId(channelId)) {
            throw new ApiError(400, "Invalid channel ID!")
        }

        if (channelId.toString() === req.user._id.toString()) {
            throw new ApiError(400, "You cannot subscribe to your own channel!")
        }

        const channel = await User.findById(channelId)
        if (!channel) {
            throw new ApiError(404, "Channel not found!")
        }

        const subscription = await Subscription.findOne({
            subscriber: req.user._id,
            channel: channelId
        })

        if (subscription) {
            await Subscription.findByIdAndDelete(subscription._id)
            return res.status(200).json(
                new ApiResponse(200, { isSubscribed: false }, "Unsubscribed successfully")
            )
        }

        const newSubscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })

        const createdSubscription = await Subscription.findById(newSubscription._id)
            .populate("subscriber", "fullName userName avatar")
            .populate("channel", "fullName userName avatar")

        return res.status(200).json(
            new ApiResponse(200, createdSubscription, "Subscribed successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to toggle subscription!")
    }
}

const getUserChannelSubscribers = async (req, res) => {
    try {
        const {channelId} = req.params

        if (!isValidObjectId(channelId)) {
            throw new ApiError(400, "Invalid channel ID!")
        }

        const subscribers = await Subscription.aggregate([
            { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
            { $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    { $project: { fullName: 1, userName: 1, avatar: 1, email: 1 } }
                ]
            }},
            { $addFields: { subscriber: { $first: "$subscriber" } } },
            { $project: { subscriber: 1, createdAt: 1 } },
            { $sort: { createdAt: -1 } }
        ])

        return res.status(200).json(
            new ApiResponse(200, subscribers, "Subscribers fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to fetch subscribers!")
    }
}

const getSubscribedChannels = async (req, res) => {
    try {
        const {subscriberId} = req.params

        if (!isValidObjectId(subscriberId)) {
            throw new ApiError(400, "Invalid subscriber ID!")
        }

        const channels = await Subscription.aggregate([
            { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
            { $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    { $project: { fullName: 1, userName: 1, avatar: 1 } }
                ]
            }},
            { $addFields: { channel: { $first: "$channel" } } },
            { $project: { channel: 1, createdAt: 1 } },
            { $sort: { createdAt: -1 } }
        ])

        return res.status(200).json(
            new ApiResponse(200, channels, "Subscribed channels fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to fetch subscribed channels!")
    }
}

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}