const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

app.post("/register/", async (request, response) => {
  const { name, username, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password);
  const selectUserQuery = `
    SELECT* 
    FROM user 
    WHERE username = ${username};`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const creatUserQuery = `
        INSERT INTO  user (username, name, password, gender, location) 
        VALUES (
            '${username}',
            '${name}',
            '${password}',
            '${gender}',
            '${location}'
            );`;
    const dbResponse = await db.run(creatUserQuery);
    response.status(400);
    response.send("User already exists");
  } else if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    response.status(200);
    response.send("User created successfully");
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT*
    FROM user 
    WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkForUser = `
    SELECT* 
    FROM user 
    WHERE username = '${username}';`;
  const dbUser = await db.get(checkForUser);
  if (dbUser === undefined) {
    response.status(400);
  } else {
    const isPasswordMatch = await bcypt.compare(oldPassword, dbUser.password);
    if (isPasswordMatch === true) {
      const passwordLength = newPassword.length;
      if (passwordLength < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptPassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = `
                 UODATE user 
                 SET password = '${encryptPassword}'
                 WHERE username = '{username}';`;
        await db.run(updateQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports();
