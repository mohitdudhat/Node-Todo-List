const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

const listItems = [];
const workItems = [];

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://mohitdudhat14:hqxVPAUm9lvoAWcO@cluster0.6he9gam.mongodb.net/todolistDB?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
  }
);
const itemsSchema = {
  name: String,
};
const Item = mongoose.model("item", itemsSchema);
const item1 = new Item({
  name: "Item1",
});
const item2 = new Item({
  name: "Item2",
});
const item3 = new Item({
  name: "Item3",
});

const defaultItems = [item1, item2, item3];
const listSchema = { name: String, items: [itemsSchema] };
const List = mongoose.model("List", listSchema);
app.get("/", function (req, res) {
  const day = date.getDate();
  Item.find({}).then((foundItems) => {
    if (!foundItems.length) {
      Item.insertMany(defaultItems)
        .then(function () {
          console.log("Default items inserted successfully.");
        })
        .catch(function (err) {
          console.error("Error inserting default items:", err);
        });
      res.redirect("/");
    }
    if (foundItems.length) {
      console.log(foundItems);
      res.render("list", {
        listTitle: "Today",
        listItems: foundItems,
      });
    }
  });
});
app.get("/:name", function (req, res) {
  const customListName = _.capitalize(req.params.name);

  List.findOne({ name: customListName })
    .then((foundItems) => {
      if (!foundItems) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      }
      if (foundItems) {
        console.log(foundItems);
        res.render("list", {
          listTitle: foundItems.name,
          listItems: foundItems.items,
        });
      }
    })
    .catch((err) => console.log(err));
});

app.post("/", function (req, res) {
  const itemName = req.body.newTodo;
  const listName = req.body.list;
  const item = new Item({ name: itemName });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        if (foundList) {
          console.log(foundList);
          foundList.items.push(item);
          foundList.save();

          res.redirect("/" + listName);
        }
      })
      .catch((err) => {
        console.error("Error finding list for adding item:", err);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName == "Today") {
    Item.findByIdAndRemove(checkedItemId).then((err) => {
      console.log(err);
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    ).then(() => {
      res.redirect("/" + listName);
    });
  }
});

app.listen(process.env.PORT || 3030, function () {
  console.log("Server running on port 3000.");
});
