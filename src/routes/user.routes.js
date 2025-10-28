import { Router } from "express";
import userController from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.post(
    "/register",
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    userController.registerUser
);

router.post("/login", userController.loginUser)

// secured routes
router.post("/logout", verifyJWT, userController.logoutUser)
router.post("/refresh-token", userController.refreshAccessToken)
router.post("/change-password", verifyJWT, userController.changeCurrentPassword)
router.get("/current-user", verifyJWT, userController.getCurrentUser)
router.patch("/update-account", verifyJWT, userController.updateAccountDetails)
router.patch("/avatar", verifyJWT, upload.single("avatar"), userController.updateUserAvatarImage)
router.patch("/cover-image", verifyJWT, upload.single("coverImage"), userController.updateUserCoverImage)
router.get("/c/:username", verifyJWT, userController.getUserChannelProfile)
router.get("/history", verifyJWT, userController.getWatchHistory)
router.patch("/watch/:videoId", verifyJWT, userController.addToWatchHistory)

export default router;
