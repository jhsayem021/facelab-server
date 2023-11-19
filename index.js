
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { query } = require('express');
require('dotenv').config()
const port = process.env.PORT || 8000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  console.log(authorization.headers)
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    console.log(err)
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sezawpu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Facelab database noSQL
    const usersCollection = client.db("facelabdb").collection("users");
    const postCollection = client.db("facelabdb").collection("feedposts");
    const reactionCollection = client.db("facelabdb").collection("postReact");
    const commentCollection = client.db("facelabdb").collection("postComment");
 

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '12h' })

      res.send({ token })
    })


    // users related apis
    app.get('/users', verifyJWT, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post('/users', verifyJWT, async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // security layer: verifyJWT
  


    app.post('/feedpost', verifyJWT, async (req, res) => {
      const newPost = req.body;
      const result = await postCollection.insertOne(newPost)
      res.send(result);
    })

    app.delete('/feedpost/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter1 = { _id: new ObjectId(id) }
      const filter2 = { postId: id }
      const result = await postCollection.deleteOne(filter1);
      const result1 = await reactionCollection.deleteOne(filter2);
      const result2 = await commentCollection.deleteOne(filter2);
      console.log(result , result1 , result2);
      res.send(result);
    })

    app.post('/postComment', verifyJWT, async (req, res) => {
      const newComment = req.body;
      console.log(newComment);
      const result = await commentCollection.insertOne(newComment)
      res.send(result);
    })
    app.get('/postComment', verifyJWT,  async (req, res) => {
      const id = req.query.id;
      console.log(id);
      const query = { postId: id };
      const result = await commentCollection.find(query).toArray();
      res.send(result);
    });

    app.delete('/postComment/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter = { _id: new ObjectId(id) }
      const result = await commentCollection.deleteOne(filter);
      console.log(result );
      res.send(result);
    })

    app.post('/postReact', verifyJWT, async (req, res) => {
      const newReaction = req.body;
      console.log(newReaction);
      const result = await reactionCollection.insertOne(newReaction)
      res.send(result);
    })
    app.delete('/postReact/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      console.log(email)
      const filter = { reactor: email }     
      const result = await reactionCollection.deleteOne(filter);     
      console.log(result );
      res.send(result);
    })
    app.get('/singlepost', verifyJWT,  async (req, res) => {
      const id = req.query.id;
      console.log(id);
      const query = { postId: id };
      const result = await reactionCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/feedpost', verifyJWT, async (req, res) => {
      const result = await postCollection.find().toArray();
      res.send(result);
    })
    app.get('/checkserver', async (req, res) => {
      const  demo = {
        name: "jahid",
        age: 25
      }
      
      res.send(demo);
    })







    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Facelab Server is running')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})


