const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
var jwt = require('jsonwebtoken');
const e = require('express');
// const cookiesParser = require('cookie-parser');
require("dotenv").config();
const port = process.env.PORT || 5000;

//middle were data bancend get koror jonno.
app.use(cors());
app.use(express.json());
// app.use(cookiesParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uruvxpx.mongodb.net/?retryWrites=true&w=majority`;

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
        // await client.connect();
        // const ServicesCollation = client.db("serviceDB").collection("service");
        const database = client.db("BistobossDB");
        const ServicesCollation = database.collection("bistoboss");
        const databases = client.db("BistobossDB");
        const BookingCollation = databases.collection("cards");
        const UsersCollation = databases.collection("users");

        app.post('/jwt', async(req, res) => {
                // console.log(req.headers)
                const user = req.body;
                const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
                res.send({ token })
            })
            //middle were----------->
        const verifyToken = (req, res, next) => {
            console.log("inside thke token of ", req.headers)
            if (!req.headers.authorization) {
                return res.status(401).send({ message: "forbidden access" })
            }
            const token = req.headers.authorization.split(" ")[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                    if (err) {
                        return res.status(401).send({ message: "forbidden access" })
                    }
                    req.decoded = decoded;
                    next()
                })
                // next()
        }
        const verifyAdmin = async(req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await UsersCollation.find(query);
            const isAdmin = user.role === "admin";
            if (!isAdmin) {
                return res.send({ message: "forbidden user" })
            }
            next()
        }
        app.get('/users/admin/:email', verifyToken, async(req, res) => {
            const email = req.params.email
            if (email !== req.decoded.email) {
                return res.send({ message: 'unauthoeze access' })
            }
            const query = { email: email }
            const user = await UsersCollation.findOne(query);
            let admin = false
            if (user) {
                admin = user.role === 'admin'
            }
            res.send({ admin })
        })
        app.post('/users', async(req, res) => {
            const data = req.body;
            console.log(data)
            const query = { email: data.email }
            const constexistinguser = await UsersCollation.findOne(query);
            if (constexistinguser) {
                return res.send({ message: 'user is all ready exists', insertId: null }, )
            }
            const result = await UsersCollation.insertOne(data);
            res.send(result)
        });
        app.get('/users', verifyToken, verifyAdmin, async(req, res) => {
            // const email = req.query.email;
            // const query = { email: email }
            const result = await UsersCollation.find().toArray();
            res.send(result)
        });
        app.patch('/users/admin/:id', verifyToken, verifyAdmin, async(req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await UsersCollation.updateOne(filter, updatedoc);
            res.send(result)
        })
        app.delete('/users/:id', verifyToken, verifyAdmin, async(req, res) => {
            const id = req.params.id;
            const quary = { _id: new ObjectId(id) }
            const result = await UsersCollation.deleteOne(quary);
            res.send(result)
        })

        app.get('/bistoboss', async(req, res) => {
            const cours = ServicesCollation.find();
            const result = await cours.toArray();
            res.send(result)
        });

        app.get('/bistoboss/:id', async(req, res) => {
            const id = req.params.id;
            const quary = { _id: new ObjectId(id) };

            const result = await ServicesCollation.findOne(quary);
            res.send(result)
        });

        app.post('/cards', async(req, res) => {
            const data = req.body;
            console.log(data)
            const result = await BookingCollation.insertOne(data);
            res.send(result)
        });
        app.get('/cards', async(req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await BookingCollation.find(query).toArray();
            res.send(result)
        })

        app.delete('/cards/:id', async(req, res) => {
            const id = req.params.id;
            const quary = { _id: new ObjectId(id) }
            const result = await BookingCollation.deleteOne(quary);
            res.send(result)
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
    res.send('Hello Hassaaaaaaaaaaaaaaaaaaaaaaaaaaaaannnnnnnnnnnnnnnnnn')
})

app.listen(port, () => {
    console.log(`
Example app listening on port ${port}
`)
})