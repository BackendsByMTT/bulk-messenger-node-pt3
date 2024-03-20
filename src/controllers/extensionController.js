const wss = require("../utlis/socket");

const sendRequestToProcess = async () => {};

const addBatch = async (req, res, next) => {
  try {
    const { message, ids, time, count } = req.body;
    const users = ids.split(",");

    for (let i = 0; i < users.length; i += count) {
      for (let j = i; j < i + count && j < users.length; j++) {
        const user = users[j];
        try {
          sentMessage(user, message, "success", fbUsername, username);
        } catch (error) {
          console.log(error.message);
          sentMessage(user, message, "failed", fbUsername, username);
          continue;
        }
      }

      // If not all users have been processed, wait for 30 seconds before proceeding
      if (i + count < users.length) {
        console.log(`Scheduled next ${count} after ${interval / 1000} seconds`);
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }
    return res.json({ success: true, message: { ...req.body } });
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
};

module.exports = { addBatch };
