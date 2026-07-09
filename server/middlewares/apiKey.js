const { Op } = require("sequelize");
const { User, ApiLog } = require("../models");

const checkApiKey = async (req, res, next) => {
  const apikey = req.headers.apikey;

  if (!apikey) {
    return res.status(401).json("Tidak ada api key");
  }

  const user = await User.findOne({ where: { api_key: apikey } });

  if (!user) {
    return res.status(401).json("Invalid API KEY");
  }

  req.yangpakai = user;
  next();
};

const rateLimit = async (req, res, next) => {
  const tier = await ApiTierlist.findByPk(req.yangpakai.api_level);

  const count = await ApiLog.count({
    where: {
      pengguna_id: req.yangpakai.pengguna_id,
      createdAt: { [Op.gte]: Date.now() - 10 * 1000 },
    },
  });
  console.log(count);

  if (req.yangpakai.api_level !== "premium" && count >= tier.api_limit) {
    return res.status(429).json("Too Many Request");
  }

  next();
};

const logAccess = async (req, res, next) => {
  await ApiLog.create({ user_id: req.yangpakai.user_id });
  next();
};

const cekQuota = async (req, res, next) => {
  if (req.yangpakai.api_level !== "premium" && req.yangpakai.api_quota <= 0) {
    return res.status(400).json("Quota sudah habis");
  }

  next();
};

const kurangiQuota = async (req, res, next) => {
  if (req.yangpakai.api_level !== "premium") {
    await req.yangpakai.increment({ api_quota: -1 });
  }

  next();
};

const middlewareApi = {
  checkApiKey,
  rateLimit,
  logAccess,
  cekQuota,
  kurangiQuota,
};

module.exports = middlewareApi;
