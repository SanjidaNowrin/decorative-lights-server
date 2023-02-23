const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const cors = require("cors");
const app = express();
//dotenv
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET);

const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.MONGO_CONNECTION_STRING}:${process.env.MONGO_CONNECTION_PASS}@cluster0.uj11r.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri);
// const uri = process.env.MONGO_CONNECTION_STRING;
//console.log(uri);

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    //console.log("connected to database");
    const database = client.db("decorativeLights");
    const productsCollection = database.collection("products");
    const cart_Collection = database.collection("cart");
    const usersCollection = database.collection("users");
    const reviewCollection = database.collection("reviews");

    //get api

    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
    });

    // load single service get api
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const products = await productsCollection.findOne(query);
      res.json(products);
    });

    //cart
    app.get("/singlecart", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const carts = await cart_Collection.find(query).toArray();

      res.json(carts);
    });
    // load cart data according to user id get api
    app.get("/cart/:uid", async (req, res) => {
      const uid = req.params.uid;
      const query = { uid: uid };
      const result = await cart_Collection.find(query).toArray();
      res.json(result);
    });

    // add data to cart collection with additional info
    app.post("/product/add", async (req, res) => {
      const product = req.body;
      const result = await cart_Collection.insertOne(product);
      res.json(result);
    });

    // delete data from cart delete api
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await cart_Collection.deleteOne(query);
      res.json(result);
    });
    //  make admin
    app.post("/addUserInfo", async (req, res) => {
      console.log("req.body");
      const result = await usersCollection.insertOne(req.body);
      res.send(result);
      console.log(result);
    });
    app.put("/makeAdmin", async (req, res) => {
      const filter = { email: req.body.email };
      const result = await usersCollection.find(filter).toArray();
      if (result) {
        const documents = await usersCollection.updateOne(filter, {
          $set: { role: "admin" },
        });
        console.log(documents);
      }
    });

    // check admin or not
    app.get("/checkAdmin/:email", async (req, res) => {
      const result = await usersCollection
        .find({ email: req.params.email })
        .toArray();
      console.log(result);
      res.send(result);
    });

    // add product from form using dashboard admin
    app.post("/addproduct", async (req, res) => {
      console.log(req.body);
      const result = await productsCollection.insertOne(req.body);
      console.log(result);
    });
    // get all orders
    app.get("/allProducts", async (req, res) => {
      const cursor = productsCollection.find({});
      const services = await cursor.toArray();
      res.send(services);
    });
    // delete orders

    app.delete("/deleteProducts/:id", async (req, res) => {
      console.log(req.params.id);
      const result = await productsCollection.deleteOne({
        _id: ObjectId(req.params.id),
      });
      res.send(result);
    });

    //manage all order
    app.get("/allOrders", async (req, res) => {
      const cursor = cart_Collection.find({});
      const services = await cursor.toArray();
      res.send(services);
    });
    app.delete("/deleteEvent/:id", async (req, res) => {
      console.log(req.params.id);
      const result = await cart_Collection.deleteOne({
        _id: ObjectId(req.params.id),
      });
      res.send(result);
    });
    //update
    app.put("/allOrders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const event = {
        $set: {
          status: "Shipped",
        },
      };
      const result = await cart_Collection.updateOne(query, event);
      res.json(result);
    });

    //addreview
    app.get("/reviews", async (req, res) => {
      const cursor = reviewCollection.find({});
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    app.post("/addreview", async (req, res) => {
      console.log(req.body);
      const result = await reviewCollection.insertOne(req.body);
      console.log(result);
    });

    //payment
    app.get("/payments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await cart_Collection.findOne(query);
      res.json(result);
    });
    //update
    app.put("/payments/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          payment: payment,
        },
      };
      const result = await cart_Collection.updateOne(filter, updateDoc);
      res.json(result);
    });

    app.post("/payment", cors(), async (req, res) => {
      let { amount, id } = req.body;
      try {
        const payment = await stripe.paymentIntents.create({
          amount,
          currency: "USD",
          description: "ALAMP",
          payment_method: id,
          confirm: true,
        });
        console.log("Payment", payment);
        res.json({
          message: "Payment successful",
          success: true,
        });
      } catch (error) {
        console.log("Error", error);
        res.json({
          message: "Payment failed",
          success: false,
        });
      }
    });
  } finally {
    //await client.close()
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running Decorative Lights Site");
});
app.listen(port, () => {
  console.log("Running Decorative Lights Site", port);
});
