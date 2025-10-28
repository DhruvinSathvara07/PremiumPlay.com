import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"


const createPlaylist = async (req, res) => {
    try {
        const {name, description} = req.body

        if (!name?.trim() || !description?.trim()) {
            throw new ApiError(400, "Name and description are required!")
        }

        const playlist = await Playlist.create({
            name,
            description,
            owner: req.user._id
        })

        const createdPlaylist = await Playlist.findById(playlist._id)
            .populate("owner", "fullName userName avatar")

        return res.status(201).json(
            new ApiResponse(201, createdPlaylist, "Playlist created successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to create playlist!")
    }
}

const getUserPlaylists = async (req, res) => {
    try {
        const {userId} = req.params

        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID!")
        }

        const playlists = await Playlist.find({ owner: userId })
            .populate("owner", "fullName userName avatar")
            .populate("videos")
            .sort({ createdAt: -1 })

        return res.status(200).json(
            new ApiResponse(200, playlists, "Playlists fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to fetch playlists!")
    }
}

const getPlaylistById = async (req, res) => {
    try {
        const {playlistId} = req.params

        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist ID!")
        }

        const playlist = await Playlist.findById(playlistId)
            .populate("owner", "fullName userName avatar")
            .populate({
                path: "videos",
                populate: {
                    path: "owner",
                    select: "fullName userName avatar"
                }
            })

        if (!playlist) {
            throw new ApiError(404, "Playlist not found!")
        }

        return res.status(200).json(
            new ApiResponse(200, playlist, "Playlist fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to fetch playlist!")
    }
}

const addVideoToPlaylist = async (req, res) => {
    try {
        const {videoId, playlistId} = req.params

        if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid video or playlist ID!")
        }

        const video = await Video.findById(videoId)
        const playlist = await Playlist.findById(playlistId)

        if (!video) {
            throw new ApiError(404, "Video not found!")
        }

        if (!playlist) {
            throw new ApiError(404, "Playlist not found!")
        }

        if (playlist.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You don't have permission to modify this playlist!")
        }

        if (playlist.videos.includes(videoId)) {
            throw new ApiError(400, "Video already exists in the playlist!")
        }

        playlist.videos.push(videoId)
        await playlist.save()

        const updatedPlaylist = await Playlist.findById(playlistId)
            .populate("owner", "fullName userName avatar")
            .populate({
                path: "videos",
                populate: {
                    path: "owner",
                    select: "fullName userName avatar"
                }
            })

        return res.status(200).json(
            new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to add video to playlist!")
    }
}

const removeVideoFromPlaylist = async (req, res) => {
    try {
        const {videoId, playlistId} = req.params

        if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid video or playlist ID!")
        }

        const playlist = await Playlist.findById(playlistId)

        if (!playlist) {
            throw new ApiError(404, "Playlist not found!")
        }

        if (playlist.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You don't have permission to modify this playlist!")
        }

        if (!playlist.videos.includes(videoId)) {
            throw new ApiError(400, "Video does not exist in the playlist!")
        }

        playlist.videos = playlist.videos.filter(id => id.toString() !== videoId.toString())
        await playlist.save()

        const updatedPlaylist = await Playlist.findById(playlistId)
            .populate("owner", "fullName userName avatar")
            .populate({
                path: "videos",
                populate: {
                    path: "owner",
                    select: "fullName userName avatar"
                }
            })

        return res.status(200).json(
            new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to remove video from playlist!")
    }
}

const deletePlaylist = async (req, res) => {
    try {
        const {playlistId} = req.params

        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist ID!")
        }

        const playlist = await Playlist.findById(playlistId)

        if (!playlist) {
            throw new ApiError(404, "Playlist not found!")
        }

        if (playlist.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You don't have permission to delete this playlist!")
        }

        await Playlist.findByIdAndDelete(playlistId)

        return res.status(200).json(
            new ApiResponse(200, {}, "Playlist deleted successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to delete playlist!")
    }
}

const updatePlaylist = async (req, res) => {
    try {
        const {playlistId} = req.params
        const {name, description} = req.body

        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist ID!")
        }

        const playlist = await Playlist.findById(playlistId)

        if (!playlist) {
            throw new ApiError(404, "Playlist not found!")
        }

        if (playlist.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You don't have permission to update this playlist!")
        }

        const updateData = {}
        if (name?.trim()) updateData.name = name
        if (description?.trim()) updateData.description = description

        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            { $set: updateData },
            { new: true }
        ).populate("owner", "fullName userName avatar")
        .populate("videos")

        return res.status(200).json(
            new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to update playlist!")
    }
}

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}