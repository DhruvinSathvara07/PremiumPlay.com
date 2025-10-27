import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const toggleSubscription = async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
}

// controller to return subscriber list of a channel
const getUserChannelSubscribers = async (req, res) => {
    const {channelId} = req.params
}

// controller to return channel list to which user has subscribed
const getSubscribedChannels = async (req, res) => {
    const { subscriberId } = req.params
}

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}