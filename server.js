const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { v4: uuidv4 } = require('uuid');

const database = [];
const UTCformatRegExp = /^([0-9]{4,})-(0[1-9]{1}|1[012]{1})-((0[1-9]{1}|(1|2)[0-9]{1})|(3[01]))$/;

app.use(cors())
app.use(express.static('public'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
   res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", (request, response) => {
   const { username } = request.body;

   const newUser = {
      _id: uuidv4(),
      username,
      count: 0,
      log: []
   };

   database.push(newUser);

   return response.json({
      _id: newUser._id,
      username: newUser.username
   });
});


app.get("/api/users", (request, response) => {
   response.json(database);
});


app.post("/api/users/:_id/exercises", (request, response) => {
   const { _id } = request.params;
   const { description, duration, date } = request.body;

   const matchedIndex = database.findIndex(elem => elem._id === _id);

   if (matchedIndex === -1) {
      return response.json({ error: "id not found" });
   };

   const isDateUndefined =
      date === "" || date === undefined
         ? new Date().toDateString()
         : new Date(date).toDateString();

   database[matchedIndex].log.push({
      description,
      duration: parseInt(duration),
      date: isDateUndefined
   });

   database[matchedIndex].count = database[matchedIndex].count + 1;

   return response.json({
      _id: database[matchedIndex]._id,
      username: database[matchedIndex].username,
      description: database[matchedIndex].log[database[matchedIndex].log.length - 1].description,
      duration: database[matchedIndex].log[database[matchedIndex].log.length - 1].duration,
      date: database[matchedIndex].log[database[matchedIndex].log.length - 1].date,
   });
});


app.get("/api/users/:_id/logs", (request, response) => {
   const { _id } = request.params;
   const { from, to, limit } = request.query;

   if (!UTCformatRegExp.test(from) || !UTCformatRegExp.test(to)) {
      return response.json({ error: "dates provided are invalid" });
   }

   const matchedIndex = database.findIndex(elem => elem._id === _id);
   const filteredArray = [];

   if (matchedIndex === -1) return response.json({ error: "user does not exist" });

   const limitOfLogs = parseInt(limit) === 0 || limit === undefined
      ? Number.MAX_SAFE_INTEGER
      : parseInt(limit);

   // unixFrom defaults to 1900; unixTo defaults to 2100
   const unixFrom = from === undefined ? -2208988800000 : new Date(from).getTime();
   const unixTo = to === undefined ? 4102444800000 : new Date(to).getTime();


   const filteredArrayIndexes = database[matchedIndex].log.map((elem, index) => {
      let elemUnix = new Date(elem.date).getTime();

      if (elemUnix > unixFrom && elemUnix > unixTo) return;
      if (elemUnix < unixFrom && elemUnix < unixTo) return;

      return index;
   });

   filteredArrayIndexes.forEach((elem) => {

      if (filteredArray.length === limitOfLogs) return;

      if (elem !== undefined) {
         filteredArray.push(database[matchedIndex].log[elem]);
         return;
      };
   });

   return response.json({
      username: database[matchedIndex].username,
      count: filteredArray.length,
      _id: database[matchedIndex]._id,
      log: filteredArray
   });
});


const listener = app.listen(process.env.PORT || 3000, () => {
   console.log('Your app is listening on port ' + listener.address().port)
})
