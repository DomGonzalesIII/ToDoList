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
mongoose.connect('mongodb://localhost:27017/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

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

app.get('/', (req, res) => {
  // read items from the database
  Item.find({}, (err, foundItems) => {
    // if there are any issues, log em
    if (err) {
      console.log(err);
    } else {

      // if collection is empty [no items]
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log('Items successfully entered.');
          }
        });

        res.redirect('/');
      } else {
        res.render('list', { listTitle: 'Today', newListItems: foundItems });
      }
    }
  });
});

app.post('/', (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      if (err) {
        console.log(err);
      } else {
        foundList.items.push(item);
        foundList.save();
        res.redirect(`/${listName}`);
      }
    });
  }
});

app.post('/delete', (req, res) => {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Successfully deleted item.');
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundlist) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect(`/${listName}`);
        }
      });
  }

});

app.get('/:customListName', (req, res) => {
  const customListName = _.lowerCase(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (err) {
      console.log(err);
    } else {
      if (foundList) {
        // show existing list
        res.render('list', { listTitle: foundList.name, newListItems: foundList.items });
      } else {
        // create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save(() => {
          res.redirect(`/${customListName}`);
        });
      }
    }
  });

});

app.get('/about', (req, res) => {
  res.render('about');
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
