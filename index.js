import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

//Config to connect database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: process.env.dbPassword,
  port: 5432
});

//Establishing connection
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

async function getUsersList() {
  try {
    const response = await db.query("SELECT * FROM users");
    return response.rows;
  } catch(err) {
    console.error("Error getting User List", err);
  }
}

async function addNewUser(name, color) {
  try {
    const response = await db.query("INSERT INTO users (name, color) VALUES ($1, $2) RETURNING id", [name, color]);
    return response.rows[0].id;
  } catch(err) {
    console.error("Error adding new user!", err);
  }
}

async function getCurrentUser() {
  try {
    const response = await db.query("SELECT * FROM users WHERE id=$1", [currentUserId]);
    return response.rows[0];
  } catch(err) {
    console.error("Error getting current user details", err);
  }
}

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries WHERE user_id=$1", [currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  console.log(countries);
  return countries;
}
app.get("/", async (req, res) => {
  console.log(currentUserId);
  const countries = await checkVisisted();
  const currentUser = await getCurrentUser();
  const users = await getUsersList();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    console.log(countryCode);
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add == "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const name = req.body.name;
  const color = req.body.color;
  currentUserId = await addNewUser(name, color);
  res.redirect("/");


});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
