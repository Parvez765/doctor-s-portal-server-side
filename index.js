const express = require("express")
const app = express()
const port = process.env.PORT || 5000
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// MiddleWare
app.use(cors())
app.use(express.json())
require("dotenv").config()


function verifyJwt(req, res, next) {
    const authToken = req.headers.authorization
    console.log(authToken)
    if (!authToken) {
        return res.status(401).send({message : "UnAuthorized Access"})
    }
    const token = authToken.split(" ")[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send("Forbidden Access")
        }
        req.decoded = decoded
        next()
    })
}

// Connecting DataBase


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xu0oole.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        
        const appoinmentsCollection = client.db("doctorsPortal").collection("appoinmentOptions")
        const bookingsCollection = client.db("doctorsPortal").collection("bookings")
        const usersCollections = client.db("doctorsPortal").collection("users")
        const doctorsCollection = client.db("doctorsPortal").collection("doctors")

        // Getting All The Appoinments
        app.get("/appoinment", async (req, res) => {
            const date = req.query.date
            // console.log(date)
            const query = {}
            const appoinments = await appoinmentsCollection.find(query).toArray()
          
            res.send(appoinments)
        })

        app.get("/bookings", verifyJwt, async (req, res) => {

            const decodedEmail = req.decoded.email

            const email = req.query.email

            if (email !== decodedEmail) {
                return res.status(403).send({message: "Forbidden Access"})
            }
            
            const query = { email: email }
            const result = await bookingsCollection.find(query).toArray()
            res.send(result)
            
        })

        // Appoinment Collection
        app.post("/bookings", async (req, res) => {
            const user = req.body
            console.log(user)
            const result = await bookingsCollection.insertOne(user)
            res.send(result)
        })


        // Getting All Users List

        app.get("/dashboard/users",  async (req, res) => {
            const query = {}
            const result = await usersCollections.find(query).toArray()
            res.send(result)
        })

        app.get("/dashboard/users/:email", async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollections.findOne(query)
            res.send({isAdmin: user?.role === "admin"})
        } )

    // User List
        app.post("/dashboard/users", async (req, res) => {
            const user = req.body
            const result = await usersCollections.insertOne(user)
            res.send(result)
        })

        // Admin Update
        app.put("/dashboard/users/:id", verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email
            console.log(decodedEmail)
            const query = { email: decodedEmail }
            const user = await usersCollections.findOne(query)

            if (user?.role !== "admin") {
                return res.status(403).send({message: "Forbidden Access"})
            }

            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const object = {upsert: true}
            const updatedDoc = {
                $set: {
                    role: "admin"
                }
            }
            const result = await usersCollections.updateOne(filter, updatedDoc, object)
            res.send(result)
        })

        // User Delete 
        app.delete("/dashboard/users/:id", verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email
            console.log(decodedEmail)
            const query = { email: decodedEmail }
            const user = await usersCollections.findOne(query)

            if (user?.role !== "admin") {
                return res.status(403).send({message: "Forbidden Access"})
            }
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await usersCollections.deleteOne(filter)
            res.send(result)
        })

        // Assign JWT
        app.get("/jwt", async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN)
            res.send({accessToken : token})
        })

        // Get Doctor from Database
        app.get("/dashboard/adddoctors", verifyJwt, async (req, res) => {

            const decodedEmail = req.decoded.email
            console.log(decodedEmail)
            const query = { email: decodedEmail }
            const user = await usersCollections.findOne(query)

            if (user?.role !== "admin") {
                return res.status(403).send({message: "Forbidden Access"})
            }

            const filter = {}
            const result = await doctorsCollection.find(filter).toArray()
            res.send(result)
        })

        // Add Doctor to Database
        app.post("/dashboard/adddoctors", verifyJwt, async (req, res) => {

            const decodedEmail = req.decoded.email
            console.log(decodedEmail)
            const query = { email: decodedEmail }
            const user = await usersCollections.findOne(query)

            if (user?.role !== "admin") {
                return res.status(403).send({message: "Forbidden Access"})
            }

            const doctorsProfile = req.body
            const result = await doctorsCollection.insertOne(doctorsProfile)
            res.send(result)
        })
    }
    catch {
        
    }
    
}
run().catch(err=> console.log(err))



app.get("/", (req, res) => {
    res.send("Server Is Running")
})

app.listen(port, () => {
    console.log("Port is running at", port)
})