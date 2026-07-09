const { Post, PostComment, Follow, User } = require("../models");

// Catatan: mengikuti konvensi tim — controller percaya user_id & role yang
// dikirim dari client (via AUTH_USER di src/config/auth.js).

const socialController = {
  // =====================================================
  // FEED POSTS
  // =====================================================

  // GET /api/social/posts?user_id=&author_id=
  getAllPosts: async (req, res) => {
    try {
      const { author_id } = req.query;

      const where = {};
      if (author_id) where.user_id = author_id;

      const posts = await Post.findAll({
        where,
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "avatar", "role"],
          },
          {
            model: PostComment,
            as: "PostComments",
            attributes: ["id"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      const data = posts.map((p) => {
        const plain = p.get({ plain: true });
        plain.comment_count = plain.PostComments?.length || 0;
        delete plain.PostComments;
        return plain;
      });

      return res.json({ data });
    } catch (error) {
      console.error("Error getAllPosts:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // GET /api/social/posts/:id
  getPostById: async (req, res) => {
    try {
      const post = await Post.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "avatar", "role"],
          },
          {
            model: PostComment,
            as: "PostComments",
            include: [
              {
                model: User,
                as: "User",
                attributes: ["id", "name", "avatar"],
              },
            ],
          },
        ],
        order: [
          [{ model: PostComment, as: "PostComments" }, "created_at", "ASC"],
        ],
      });

      if (!post) {
        return res.status(404).json({ message: "Post tidak ditemukan." });
      }

      return res.json({ data: post });
    } catch (error) {
      console.error("Error getPostById:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // POST /api/social/posts { user_id, content, image_url }
  createPost: async (req, res) => {
    try {
      const { content, image_url } = req.body;
      const user_id = req.user.id;

      if (!content || content.trim().length < 3) {
        return res
          .status(400)
          .json({ message: "Konten post minimal 3 karakter." });
      }

      const post = await Post.create({
        user_id,
        content: content.trim(),
        image_url: image_url?.trim() || null,
      });

      return res.status(201).json({
        message: "Post berhasil dibuat.",
        data: post,
      });
    } catch (error) {
      console.error("Error createPost:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // PUT /api/social/posts/:id { user_id, content, image_url }
  updatePost: async (req, res) => {
    try {
      const { content, image_url } = req.body;
      const user_id = req.user.id;

      const post = await Post.findByPk(req.params.id);

      if (!post) {
        return res.status(404).json({ message: "Post tidak ditemukan." });
      }

      if (Number(post.user_id) !== Number(user_id)) {
        return res
          .status(403)
          .json({ message: "Kamu hanya bisa mengedit post milikmu sendiri." });
      }

      if (!content || content.trim().length < 3) {
        return res
          .status(400)
          .json({ message: "Konten post minimal 3 karakter." });
      }

      post.content = content.trim();
      post.image_url = image_url?.trim() || null;
      post.updated_at = new Date();
      await post.save();

      return res.json({
        message: "Post berhasil diperbarui.",
        data: post,
      });
    } catch (error) {
      console.error("Error updatePost:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // DELETE /api/social/posts/:id { user_id, role }
  deletePost: async (req, res) => {
    try {
      const user_id = req.user.id;
      const role = req.user.role;

      const post = await Post.findByPk(req.params.id);

      if (!post) {
        return res.status(404).json({ message: "Post tidak ditemukan." });
      }

      const isOwner = Number(post.user_id) === Number(user_id);
      const isAdmin = role === "admin";

      if (!isOwner && !isAdmin) {
        return res
          .status(403)
          .json({ message: "Kamu tidak punya akses menghapus post ini." });
      }

      await PostComment.destroy({ where: { post_id: post.id } });
      await post.destroy();

      return res.json({ message: "Post berhasil dihapus." });
    } catch (error) {
      console.error("Error deletePost:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // POST COMMENTS
  // =====================================================

  // POST /api/social/posts/:id/comments { user_id, body }
  createComment: async (req, res) => {
    try {
      const {  body } = req.body;
      const user_id = req.user.id;

      if (!body || body.trim().length < 1) {
        return res.status(400).json({ message: "Komentar tidak boleh kosong." });
      }

      const post = await Post.findByPk(req.params.id);

      if (!post) {
        return res.status(404).json({ message: "Post tidak ditemukan." });
      }

      const comment = await PostComment.create({
        post_id: post.id,
        user_id,
        body: body.trim(),
      });

      const fullComment = await PostComment.findByPk(comment.id, {
        include: [
          { model: User, as: "User", attributes: ["id", "name", "avatar"] },
        ],
      });

      return res.status(201).json({
        message: "Komentar berhasil ditambahkan.",
        data: fullComment,
      });
    } catch (error) {
      console.error("Error createComment:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // DELETE /api/social/comments/:id { user_id, role }
  deleteComment: async (req, res) => {
    try {
      const user_id = req.user.id;
      const role = req.user.role;

      const comment = await PostComment.findByPk(req.params.id);

      if (!comment) {
        return res.status(404).json({ message: "Komentar tidak ditemukan." });
      }

      const isOwner = Number(comment.user_id) === Number(user_id);
      const isAdmin = role === "admin";

      if (!isOwner && !isAdmin) {
        return res
          .status(403)
          .json({ message: "Kamu tidak punya akses menghapus komentar ini." });
      }

      await comment.destroy();

      return res.json({ message: "Komentar berhasil dihapus." });
    } catch (error) {
      console.error("Error deleteComment:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // FOLLOW / FOLLOWERS / FOLLOWING
  // =====================================================

  // POST /api/social/follow { follower_id, following_id }
  followUser: async (req, res) => {
    try {
      const follower_id = req.user.id;
      const { following_id } = req.body;

      if (!follower_id || !following_id) {
        return res
          .status(400)
          .json({ message: "follower_id dan following_id wajib diisi." });
      }

      if (Number(follower_id) === Number(following_id)) {
        return res
          .status(400)
          .json({ message: "Kamu tidak bisa mengikuti dirimu sendiri." });
      }

      const target = await User.findByPk(following_id);

      if (!target) {
        return res.status(404).json({ message: "User tidak ditemukan." });
      }

      const [follow, created] = await Follow.findOrCreate({
        where: { follower_id, following_id },
      });

      if (!created) {
        return res
          .status(400)
          .json({ message: `Kamu sudah mengikuti ${target.name}.` });
      }

      return res.status(201).json({
        message: `Berhasil mengikuti ${target.name}.`,
        data: follow,
      });
    } catch (error) {
      console.error("Error followUser:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // DELETE /api/social/follow { follower_id, following_id }
  unfollowUser: async (req, res) => {
    try {
      const follower_id = req.user.id;
      const { following_id } = req.body;
      const deleted = await Follow.destroy({
        where: { follower_id, following_id },
      });

      if (!deleted) {
        return res
          .status(404)
          .json({ message: "Kamu belum mengikuti user ini." });
      }

      return res.json({ message: "Berhasil berhenti mengikuti." });
    } catch (error) {
      console.error("Error unfollowUser:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // GET /api/social/users/:id/followers?viewer_id=
  getFollowers: async (req, res) => {
    try {
      const userId = req.params.id;
      const viewerId = req.user?.id || null;

      const followers = await Follow.findAll({
        where: { following_id: userId },
        include: [
          {
            model: User,
            as: "Follower",
            attributes: ["id", "name", "avatar", "bio", "role"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      // Tandai apakah viewer juga mengikuti orang-orang ini (buat tombol follow back)
      let viewerFollowingIds = [];
      if (viewerId) {
        const viewerFollowing = await Follow.findAll({
          where: { follower_id: viewerId },
          attributes: ["following_id"],
        });
        viewerFollowingIds = viewerFollowing.map((f) => f.following_id);
      }

      const data = followers
        .filter((f) => f.Follower)
        .map((f) => ({
          ...f.Follower.get({ plain: true }),
          followed_at: f.created_at,
          is_followed_by_viewer: viewerFollowingIds.includes(f.Follower.id),
        }));

      return res.json({ data });
    } catch (error) {
      console.error("Error getFollowers:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // GET /api/social/users/:id/following?viewer_id=
  getFollowing: async (req, res) => {
    try {
      const userId = req.params.id;
      const viewerId = req.user?.id || null;

      const following = await Follow.findAll({
        where: { follower_id: userId },
        include: [
          {
            model: User,
            as: "Following",
            attributes: ["id", "name", "avatar", "bio", "role"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      let viewerFollowingIds = [];
      if (viewerId) {
        const viewerFollowing = await Follow.findAll({
          where: { follower_id: viewerId },
          attributes: ["following_id"],
        });
        viewerFollowingIds = viewerFollowing.map((f) => f.following_id);
      }

      const data = following
        .filter((f) => f.Following)
        .map((f) => ({
          ...f.Following.get({ plain: true }),
          followed_at: f.created_at,
          is_followed_by_viewer: viewerFollowingIds.includes(f.Following.id),
        }));

      return res.json({ data });
    } catch (error) {
      console.error("Error getFollowing:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // GET /api/social/users/:id/follow-stats?viewer_id=
  getFollowStats: async (req, res) => {
    try {
      const userId = req.params.id;
      const viewerId = req.user?.id || null;

      const [followers, following] = await Promise.all([
        Follow.count({ where: { following_id: userId } }),
        Follow.count({ where: { follower_id: userId } }),
      ]);

      let is_following = false;
      if (viewerId) {
        const existing = await Follow.findOne({
          where: { follower_id: viewerId, following_id: userId },
        });
        is_following = !!existing;
      }

      return res.json({ data: { followers, following, is_following } });
    } catch (error) {
      console.error("Error getFollowStats:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // ADMIN: USERS
  // =====================================================

  // GET /api/social/admin/users?role=admin
  adminGetAllUsers: async (req, res) => {
    try {

      const users = await User.findAll({
        attributes: [
          "id",
          "name",
          "email",
          "role",
          "points",
          "avatar",
          "created_at",
        ],
        order: [["id", "ASC"]],
      });

      return res.json({ data: users });
    } catch (error) {
      console.error("Error adminGetAllUsers:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // PUT /api/social/admin/users/:id/role { role: "admin", new_role }
  adminUpdateUserRole: async (req, res) => {
    try {
      const { new_role } = req.body;

      if (!["admin", "organizer", "user"].includes(new_role)) {
        return res.status(400).json({ message: "Role tidak valid." });
      }

      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan." });
      }

      user.role = new_role;
      await user.save();

      return res.json({
        message: `Role ${user.name} berhasil diubah menjadi ${new_role}.`,
        data: { id: user.id, role: user.role },
      });
    } catch (error) {
      console.error("Error adminUpdateUserRole:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // DELETE /api/social/admin/users/:id { role: "admin" }
  adminDeleteUser: async (req, res) => {
    try {
      const admin_id = req.user.id;

      if (Number(req.params.id) === Number(admin_id)) {
        return res
          .status(400)
          .json({ message: "Kamu tidak bisa menghapus akunmu sendiri." });
      }

      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan." });
      }

      await user.destroy(); // soft delete (paranoid)

      return res.json({ message: `User ${user.name} berhasil dihapus.` });
    } catch (error) {
      console.error("Error adminDeleteUser:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // ADMIN: POSTS (moderasi)
  // =====================================================

  // GET /api/social/admin/posts?role=admin
  adminGetAllPosts: async (req, res) => {
    try {
      const posts = await Post.findAll({
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "email", "avatar"],
          },
          {
            model: PostComment,
            as: "PostComments",
            attributes: ["id"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      const data = posts.map((p) => {
        const plain = p.get({ plain: true });
        plain.comment_count = plain.PostComments?.length || 0;
        delete plain.PostComments;
        return plain;
      });

      return res.json({ data });
    } catch (error) {
      console.error("Error adminGetAllPosts:", error);
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = socialController;
