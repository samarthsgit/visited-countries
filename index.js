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
let countries;
app.get("/", async (req, res) => {
  try {
    // db.connect();
    const response = await db.query("SELECT country_code FROM visited_countries");
    countries = response.rows.map(country => country.country_code);
    console.log(countries);
    res.render("index.ejs", {countries: countries, total: countries.length});
  } catch(err) {
    console.error("Something went wrong at redirect : ", err);
    res.status(500).send("An error occured");
  }
});

app.post("/add", async (req, res) => {
  let newCountry = req.body.country.trim();
  newCountry = newCountry.charAt(0).toUpperCase() + newCountry.slice(1);
  try {
    const response = await db.query("SELECT country_code FROM countries WHERE country_name = $1", [newCountry]);
    // console.log(response);
    let newCountryCode;
    if (response.rows[0]) {
      newCountryCode = response.rows[0].country_code;
      console.log(newCountryCode);
    }

    if(newCountryCode) {
      try {
        await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [newCountryCode]);
        res.redirect("/");
      } catch(err) {
        res.render("index.ejs", {countries: countries, total: countries.length, error: "Already exist"});
      }

    } else {
      res.send('<script>alert("No Country Found"); window.location.href = "/";</script>');
    } 

  } catch(err) {
    console.error("Something went wrong in Post /add : ", err);
    res.status(500).send("Server Error");
  }
});

// db.end();

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
