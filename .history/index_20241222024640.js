const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const usersCollection = client.db('userDB').collection('users');

    // Create a new user in the database
    app.post('/register', async (req, res) => {
      const newUser = req.body;
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    // Login user
    app.post('/login', async (req, res) => {
      const { email, password } = req.body;
      const user = await usersCollection.findOne({ email, password });
      if (user) {
        res.send({ success: true, user });
      } else {
        res.status(401).send({ success: false, message: 'Invalid credentials' });
      }
    });

    // Fetch user by ID
    app.get('/users/:id', async (req, res) => {
      const { id } = req.params;
      const user = await usersCollection.findOne({ _id: new ObjectId(id) });
      res.send(user);
    });

    await client.db('admin').command({ ping: 1 });
    console.log('Connected to MongoDB successfully');
  } finally {
    // Keep the client running
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})