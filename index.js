import express from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';

const app = express();
const PORT = 3000;
const hostname = 'localhost';

const uri = "mongodb+srv://guest:guest@cluster0.wji5iwx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        await client.db('bob_ross_api').command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        const episodes = await client.db('bob_ross_api').collection('episodes').find({}).toArray();
        console.log('found episodes: ', episodes);
    }   finally {
        await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('test');
});


app.listen(PORT, () => {
  console.log(`Server running at http://${hostname}:${PORT}/`);
});