const puppeteer = require("puppeteer");
const { pool } = require("../utlis/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const queries = require("../utlis/queries");

const checkTableExists = async (database) => {
  const query = `SELECT to_regclass('public.${database}')`;
  const { rows } = await pool.query(query);
  return rows[0].to_regclass !== null;
};

const sentMessage = async (user, message, status, fbUsername, username) => {
  await pool.query(queries.addMessage, [
    user,
    message,
    status,
    fbUsername,
    username,
  ]);
};

const sendMessage = async (req, res) => {
  try {
    const { message, userIds, fbUsername, fbPassword, interval, count } =
      req.body;

    if (
      !message ||
      !userIds ||
      !fbUsername ||
      !fbPassword ||
      !interval ||
      !count
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Please fill all fields" });
    }
    const users = userIds.split(",");

    const token = req.headers.authorization.split(" ")[1];
    const facebookIdsTable = await checkTableExists("facebook_Ids");
    const tableExists = await checkTableExists("messages");
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = decodedToken.id;
    const username = decodedToken.username;

    if (facebookIdsTable) {
      const entryExits = await pool.query(queries.facebookIfEntryExits, [
        fbUsername,
        username,
      ]);

      if (entryExits.rowCount <= 0) {
        await pool.query(queries.addFacebookId, [fbUsername, username]);
      }
    } else {
      await pool.query(queries.createfacebookIdsTable);
      const entryExits = await pool.query(queries.facebookIfEntryExits, [
        fbUsername,
        username,
      ]);

      if (entryExits.rowCount <= 0) {
        await pool.query(queries.addFacebookId, [fbUsername, username]);
      }
    }

    if (!tableExists) {
      console.log("Message Table Created");
      await pool.query(queries.createMessageTable);
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        args: [
          "--disable-setuid-sandbox",
          "--no-sandbox",
          "--single-process",
          "--no-zygote",
        ],
        executablePath:
          process.env.NODE_ENV === "production"
            ? process.env.PUPPETEER_EXECUTABLE_PATH
            : puppeteer.executablePath(),
      });
      const page = await browser.newPage();

      // Navigate to Facebook login Page
      await page.goto("https://mbasic.facebook.com/");

      // Fill in login credentials (consider using environment variables)
      await page.type('input[name="email"]', fbUsername); // Use environment variable
      await page.type('input[name="pass"]', fbPassword); // Use environment variable

      await Promise.all([
        page.waitForNavigation(),
        page.click('input[name="login"]'),
      ]);

      const loginFailed = await page.$("div#login_error");
      if (loginFailed) {
        res.status(200).send({ message: "Login Failed" });
        return;
      }

      for (let i = 0; i < users.length; i += count) {
        for (let j = i; j < i + count && j < users.length; j++) {
          const user = users[j];
          try {
            await page.goto(`https://mbasic.facebook.com/${user}`);
            // Wait for the page to load
            await page.waitForSelector('a[href*="messages/thread"]');

            // Extract the href attribute of the link
            const messageLink = await page.$('a[href*="messages/thread"]');
            const href = await messageLink.getProperty("href");
            const hrefValue = await href.jsonValue();

            // Navigate to the extracted link
            await page.goto(hrefValue);

            await page.type('textarea[name="body"]', message);

            try {
              await Promise.all([
                page.waitForNavigation(),
                page.click('input[name="send"]'),
              ]);
            } catch (error) {
              console.log(error.message);
              await Promise.all([
                page.waitForNavigation(),
                page.click('input[name="Send"]'),
              ]);
            }

            console.log({
              sent: user,
              message: "success",
              time: new Date().toISOString(),
            });

            sentMessage(user, message, "success", fbUsername, username);
          } catch (error) {
            console.log(error.message);
            sentMessage(user, message, "failed", fbUsername, username);
            continue;
          }
        }

        // If not all users have been processed, wait for 30 seconds before proceeding
        if (i + count < users.length) {
          console.log(
            `Scheduled next ${count} after ${interval / 1000} seconds`
          );
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      }

      res.status(200).send({ message: "Message sent successfully" });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .send({ message: "Failed to send message", error: error.message });
    } finally {
      console.log("Request Completed");
      if (browser) {
        await browser.close();
      }
    }
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

const getAllMessages = async (req, res) => {
  try {
    const messages = await pool.query(queries.getAllMessages);
    res.status(200).json({ success: true, data: messages.rows });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching messages" });
  }
};

const getAllMessagesByUsername = async (req, res) => {
  try {
    const { agent } = req.params;
    const { rows } = await pool.query(queries.getAllMessagesByUsername, [
      agent,
    ]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching messages" });
  }
};

module.exports = {
  sendMessage,
  getAllMessages,
  getAllMessagesByUsername,
};
