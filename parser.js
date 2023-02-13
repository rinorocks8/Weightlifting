const axios = require("axios");
const cheerio = require("cheerio");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

async function scrapeExercisesPage(i) {
  const response = await axios.get(
    "https://www.jefit.com/exercises/bodypart.php?id=11&exercises=All&page=" + i
  );
  const $ = cheerio.load(response.data);

  let exercises = [];

  let table = $("#hor-minimalist_3 tbody tr td table tbody tr").toArray();
  for await (elem of table) {
    let exercise = {};

    // console.log(elem);
    const exercisePage = $(elem).find("td:nth-child(3)").find("h4").find("a");
    const exercisePageURL = exercisePage.attr("href");
    const exerciseName = exercisePage.text();

    const exercisePageResponse = await axios.get(
      "https://www.jefit.com/exercises/" + exercisePageURL
    );
    const $$ = cheerio.load(exercisePageResponse.data);

    let stats = $$(".mt-2 .p-2");

    let properties = $$(stats).find("p");
    properties.each((j, element) => {
      let property = $$(element).find("strong").text();
      if (property !== "") {
        property = $$(element).text().replace(/\n/g, "").trim().split(" : ");
        exercise[property[0].trim()] = property[1].trim();
      }
    });

    // let instructions = $$("h2 strong");
    // instructions.each((j, element) => {
    //   if ($$(element).text() === "How To Perform Exercise")
    //     exercise.Instructions = $$(element).parent().parent().find("p").text();
    // });

    exercise.name = exerciseName;
    exercises.push(exercise);
  }

  return exercises;
}

async function scrapeExercises() {
  let exercises = [];
  for (let i = 1; i <= 130; i++) {
    console.log(
      Math.round((i / 130) * 100 * 100) / 100 + "% (Page " + i + "/130)"
    );
    let page_exercises = await scrapeExercisesPage(i);
    exercises.push(page_exercises);
  }
  return exercises;
}

scrapeExercises().then((exercises) => {
  let exercisesUniform = {};
  exercises.flat().map((exercise) => {
    exercisesUniform[uuidv4()] = {
      name: exercise["name"] || "",
      "Main Muscle Group": exercise["Main Muscle Group"] || "",
      "Detailed Muscle Group": exercise["Detailed Muscle Group"] || "",
      Type: exercise["Type"] || "",
      Mechanics: exercise["Mechanics"] || "",
      Equipment: exercise["Equipment"] || "",
      Difficulty: exercise["Difficulty"] || "",
      // Instructions: exercise["Instructions"] || "",
    };
  });

  fs.writeFileSync("exercises.json", JSON.stringify(exercisesUniform, null, 2));
  console.log("Scraped exercises have been saved to exercises.json");
});
