const express = require("express");
const router = express.Router();
const socialController = require("../controllers/socialController");
const { verifyToken } = require("../middlewares/verifyJWT");
const { checkRoles } = require("../middlewares/checkRoles");

// =====================================================
// ADMIN (harus di atas route dinamis)
// =====================================================
router.get("/admin/users", verifyToken, checkRoles("admin"), socialController.adminGetAllUsers);
router.put("/admin/users/:id/role", verifyToken, checkRoles("admin"), socialController.adminUpdateUserRole);
router.delete("/admin/users/:id", verifyToken, checkRoles("admin"), socialController.adminDeleteUser);
router.get("/admin/posts", verifyToken, checkRoles("admin"), socialController.adminGetAllPosts);

// =====================================================
// FEED POSTS
// =====================================================
router.get("/posts", verifyToken, socialController.getAllPosts);
router.post("/posts", verifyToken, socialController.createPost);
router.get("/posts/:id", verifyToken, socialController.getPostById);
router.put("/posts/:id", verifyToken, socialController.updatePost);
router.delete("/posts/:id", verifyToken, socialController.deletePost);

// =====================================================
// KOMENTAR POST
// =====================================================
router.post("/posts/:id/comments", verifyToken, socialController.createComment);
router.delete("/comments/:id", verifyToken, socialController.deleteComment);

// =====================================================
// FOLLOW / FOLLOWERS / FOLLOWING
// =====================================================
router.post("/follow", verifyToken, socialController.followUser);
router.delete("/follow", verifyToken, socialController.unfollowUser);
router.get("/users/:id/followers", verifyToken, socialController.getFollowers);
router.get("/users/:id/following", verifyToken, socialController.getFollowing);
router.get("/users/:id/follow-stats", verifyToken, socialController.getFollowStats);

module.exports = router;
