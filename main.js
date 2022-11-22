const express = require("express");
const path = require("path");
const app = express();
const multer = require("multer");
const { run } = require("./index");
const fs = require("fs/promises");

const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const fileStorage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, `${"courses.json"}`);
  },
  destination: (req, file, cb) => {
    cb(null, "jsonfiles");
  },
});
app.use("/upload", multer({ storage: fileStorage }).single("file"));

app.get("/", (req, res) => {
  return res.render("index.ejs");
});

app.post("/coursera", async (req, res) => {
  const { email, password } = req.body;
  try {
    await run(email, password);
    res.download(`${__dirname}/courses.json`, function (err) {
      if (err) {
        console.log(err);
      }
    });
  } catch (e) {
    console.log(e);
    res.redirect("/");
  }
});

app.post("/upload", async (req, res) => {
  console.log(req.file);
  if (!req.file.mimetype === "application/json") {
    res.redirect("/");
    // TODO add error flash
  }

  res.redirect("/courses");
});

app.get("/courses", async (req, res) => {
  const data = await fs.readFile("jsonfiles/courses.json");
  const courses = JSON.parse(data);
  console.log(courses);

  res.render("courses", { courses });
});

app.listen(PORT, () => {
  console.log("listening on port ");
});
