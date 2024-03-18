const getHealth = (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: new Date().toLocaleDateString(),
  };

  try {
    res.send(health);
  } catch (error) {
    health.message = error;
    res.status(503).send();
  }
};

module.exports = {
  getHealth,
};
