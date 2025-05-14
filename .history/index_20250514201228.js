const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wsf9k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    // await client.connect();

    const campaignCollection = client.db('campaignDB').collection('campaign');
    const userCollection = client.db('userDB').collection('users'); 
    const donatedCollection = client.db('campaignDB').collection('donated'); 

    //  get all campaigns
    app.get('/campaign', async (req, res) => {
      const cursor = campaignCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //  add a new campaign
    app.post('/campaign', async (req, res) => {
      const newCampaign = req.body;
      console.log(newCampaign);
      const result = await campaignCollection.insertOne(newCampaign);
      res.send(result);
    });

    //  get a specific campaign by ID
    app.get('/campaign/:id', async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const campaign = await campaignCollection.findOne(query);
      res.send(campaign);
    });

    //  handle Firebase user registration
   app.post('/register-firebase', async (req, res) => {
  const user = req.body;

  try {
    // Check if the user already exists
    const existingUser = await userCollection.findOne({ email: user.email });
    if (existingUser) {
      return res.status(200).json({ message: 'User already exists' });
    }

    // Insert new user
    const result = await userCollection.insertOne(user);

    const insertedUser = await userCollection.findOne({ _id: result.insertedId });

    res.status(201).json({
      message: 'User registered successfully',
      user: insertedUser,
    });
  } catch (error) {
    console.error('Error registering Firebase user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});


//  handle donation
app.post('/donate', async (req, res) => {
  const donation = req.body;

  try {
    const result = await donationsCollection.insertOne(donation);
    res.status(200).send({ success: true, result });
  } catch (error) {
    console.error('Error saving donation:', error);
    res.status(500).send({ success: false, error: 'Failed to save donation' });
  }
});





    // Fetch donated campaigns for a specific user
    app.get('/donated', async (req, res) => {
      const { userEmail } = req.query; // Get userEmail from query params
      const query = { userEmail };

      try {
        const donatedCampaigns = await donatedCollection.find(query).toArray();
        res.json(donatedCampaigns); // Send the donated campaigns as a response
      } catch (error) {
        console.error("Error fetching donated campaigns:", error);
        res.status(500).json({ error: 'Failed to fetch donated campaigns' });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



// GET /my-campaigns?email=user@example.com
app.get("/campaign", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).send({ message: "Email is required" });

  const campaigns = await campaignCollection
    .find({ userEmail: email })
    .toArray();

  res.send(campaigns);
});




// Delete campaign
app.delete('/campaign/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`Attempting to delete campaign with ID: ${id}`);  
  
  try {
    const result = await campaignCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 1) {
      console.log("Campaign deleted successfully");
      return res.status(200).json({ message: "Campaign deleted successfully" });
    } else {
      console.log("Campaign not found");
      return res.status(404).json({ message: "Campaign not found" });
    }
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});




// Update campaign by ID
app.put("/campaign/:id", async (req, res) => {
  const { id } = req.params;
  const updatedCampaign = req.body;

  try {
    const result = await campaignCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedCampaign }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: "Campaign updated successfully" });
    } else {
      res.status(404).json({ message: "No campaign updated" });
    }
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



























// Root endpoint
app.get('/', (req, res) => {
  res.send('Crowdfunding server is running');
});

// Start the server
app.listen(port, () => {
  console.log(`Crowdfunding server is running on port: ${port}`);
});
