const express = require("express");
const router = express.Router();
const socialController = require("../controllers/socialController");

// =====================================================
// ADMIN (harus di atas route dinamis)
// =====================================================
router.get("/admin/users", socialController.adminGetAllUsers);
router.put("/admin/users/:id/role", socialController.adminUpdateUserRole);
router.delete("/admin/users/:id", socialController.adminDeleteUser);
router.get("/admin/posts", socialController.adminGetAllPosts);

// =====================================================
// FEED POSTS
// =====================================================
router.get("/posts", socialController.getAllPosts);
router.post("/posts", socialController.createPost);
router.get("/posts/:id", socialController.getPostById);
router.put("/posts/:id", socialController.updatePost);
router.delete("/posts/:id", socialController.deletePost);

// =====================================================
// KOMENTAR POST
// =====================================================
router.post("/posts/:id/comments", socialController.createComment);
router.delete("/comments/:id", socialController.deleteComment);

// =====================================================
// FOLLOW / FOLLOWERS / FOLLOWING
// =====================================================
router.post("/follow", socialController.followUser);
router.delete("/follow", socialController.unfollowUser);
router.get("/users/:id/followers", socialController.getFollowers);
router.get("/users/:id/following", socialController.getFollowing);
router.get("/users/:id/follow-stats", socialController.getFollowStats);

module.exports = router;
