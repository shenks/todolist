const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname + "/public", { maxAge: 0 }));

mongoose.connect(
  "mongodb+srv://shenkslee:test123@cluster0.rnbg8kx.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
  }
);

//structure of data and collection/model
const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

//doneItems schema and model
const doneItemSchema = new mongoose.Schema({
  name: String,
});

const DoneItem = mongoose.model("DoneItem", doneItemSchema);

// Define a base route
app.get("/", (req, res) => {
  Item.find({})
    .then((foundItems) => {
      console.log("found items");
      res.render("index", { newListItems: foundItems });
    })
    .catch((err) => {
      console.error(err);
    });
});

// Define a POST route to add item
app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const item = new Item({
    name: itemName,
  });
  item.save();
  //redirect to app.get route above
  res.redirect("/");
});

// define the POST route for deleting an item
app.post("/delete", async (req, res) => {
  try {
    const itemId = req.body.itemId;
    const deletedItem = await Item.findByIdAndRemove(itemId);

    if (!deletedItem) {
      return res.status(404).send("Item not found.");
    }

    console.log("Item deleted successfully.");
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting item.");
  }
});

app.post("/done", async (req, res) => {
  const itemId = req.body.itemId; // Retrieve the item ID from the request body

  try {
    // Use Mongoose to find the item by its ID
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).send("Item not found.");
    }

    // Create a new done item using the DoneItem model
    const doneItem = new DoneItem({
      name: item.name,
    });
    
    await doneItem.save();

    // Delete the original item from the current list
    await Item.findByIdAndRemove(itemId);

    console.log("Item moved to Done successfully.");
    res.redirect("/"); // Redirect to the main page after the item moved
  } catch (err) {
    console.error(err);
    res.status(500).send("Error moving item to Done.");
  }
});

app.get("/done", async (req, res) => {
  try {
    // Retrieve the done items from db
    const doneItems = await DoneItem.find({});

    // Render done.ejs template and pass the doneItems variable 
    res.render("done", { newListItems: doneItems });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching Done items.");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
