const addMessage =
  "INSERT INTO messages (sent_to, message, status, sent_from, agent) VALUES($1, $2, $3, $4, $5) RETURNING sent_to, message, status";

const createMessageTable =
  "CREATE TABLE messages ( id SERIAL PRIMARY KEY, sent_to VARCHAR(255) NOT NULL, message TEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, sent_from VARCHAR(255) NOT NULL, agent VARCHAR(255) NOT NULL REFERENCES users(username));";

const getAllMessages = "SELECT * FROM messages";

const createUsersTable =
  "CREATE TABLE users( id SERIAL NOT NULL, username VARCHAR(255) PRIMARY KEY, name VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'inactive', role VARCHAR(20) NOT NULL DEFAULT 'agent', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP); ";

const addNewUser =
  "INSERT INTO users (username, name, password, status, role) VALUES($1, $2, $3, $4, $5) RETURNING username, password, role";

const createfacebookIdsTable =
  "CREATE TABLE facebook_Ids( id VARCHAR(255), assigned_to VARCHAR(255) NOT NULL REFERENCES users(username));";

const addFacebookId =
  "INSERT INTO facebook_Ids (id, assigned_to) VALUES($1, $2)";

const facebookIfEntryExits =
  "SELECT * FROM facebook_Ids WHERE id = $1 AND assigned_to = $2";

const checkForAdmin =
  "SELECT role FROM users WHERE username = $1 AND role = 'admin'";

const deleteAgent =
  "DELETE FROM users WHERE username = $1 AND role='agent' RETURNING *";

const checkAgentExist =
  "SELECT * FROM users WHERE username = $1 AND role='agent'";

const updateAgentName =
  "UPDATE users SET name = $1 WHERE username = $2 AND role='agent'";

const updateAgentPassword =
  "UPDATE users SET password = $1 WHERE username = $2 AND role='agent'";

const updateAgentStatus =
  "UPDATE users SET status = $1 WHERE username = $2 AND role='agent'";

const getAllUsers = "SELECT * FROM users";

const getUserByUsername = "SELECT * FROM users WHERE username = $1";

const getAllAgents = "SELECT * FROM users WHERE role='agent'";

const getAgentByUsername =
  "SELECT * FROM users WHERE username = $1 AND role='agent'";

const getAllMessagesByUsername = "SELECT * FROM messages WHERE agent = $1";

module.exports = {
  addMessage,
  createMessageTable,
  getAllMessages,
  createUsersTable,
  getUserByUsername,
  addNewUser,
  addFacebookId,
  createfacebookIdsTable,
  facebookIfEntryExits,
  checkForAdmin,
  deleteAgent,
  checkAgentExist,
  updateAgentName,
  updateAgentPassword,
  updateAgentStatus,
  getAllUsers,
  getAllAgents,
  getAgentByUsername,
  getAllMessagesByUsername,
};
