// jshint esversion: 6

// jscs: disable maximumLineLength
// jscs: disable requirePaddingNewLinesBeforeLineComments

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// connecting to mongodb database
const user = process.env.MDB_USER;
const pass = process.env.MDB_SECRET;

mongoose.connect(`mongodb://${user}:${pass}@cluster0-shard-00-00.u2ymp.mongodb.net:27017,cluster0-shard-00-01.u2ymp.mongodb.net:27017,cluster0-shard-00-02.u2ymp.mongodb.net:27017/todolistDB?ssl=true&replicaSet=atlas-gusmsf-shard-0&authSource=admin&retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

// create document schema
const itemSchema = {
  name: String,
};

// create model
const Item = mongoose.model('Item', itemSchema);

// create initial items
const item1 = new Item({
  name: 'Welcome to your todolist!',
});

const item2 = new Item({
  name: 'Hit the + button to add a new item.',
});

const item3 = new Item({
  name: '<-- Hit this to delete an item.',
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = new mongoose.model('List', listSchema);

app.get('/', async (req, res) => {

  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      res.redirect('/');
    } else {
      res.render('list', { listTitle: 'Today', newListItems: foundItems });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post('/', async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  try {
    if (listName === 'Today') {
      await item.save();
      res.redirect('/');
    } else {
      const foundList = await List.findOne({ name: listName });
      await foundList.items.push(item);
      await foundList.save();
      res.redirect(`/${listName}`);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post('/delete', async (req, res) => {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  try {
    if (listName === 'Today') {
      await Item.findByIdAndRemove(checkedItemId);
      console.log('Successfully deleted item.');
      res.redirect('/');
    } else {
      const foundList = await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } });
      res.redirect(`${listName}`);
    }
  } catch (err) {
    console.log(err);
  }
});

// moved before parametered route to ensure this gets used
app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/:customListName', async (req, res) => {
  const customListName = _.lowerCase(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });
    if (foundList) {
      res.render('list', { listTitle: foundList.name, newListItems: foundList.items });
    } else {
      // create new list
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      await list.save();
      res.redirect(`/${customListName}`);
    }
  } catch (err) {
    console.log(err);
  }
});

// app works on Heroku or local port
app.listen(process.env.PORT || 3000, function () {
  console.log('Server is running.');
});
