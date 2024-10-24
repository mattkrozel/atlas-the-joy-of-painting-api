
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
        const colors = await client.db('bob_ross_api').collection('colors').find({}).toArray();
        const subjects = await client.db('bob_ross_api').collection('subjects').find({}).toArray();
        console.log('found episodes: ', episodes);
        //console.log('found colors: ', colors);
        //console.log('found subjects: ', subjects);
    }   finally {
        //
    }
}

run().catch(console.dir);

app.get('/episodes', async (req, res) => {
    const { month, subject, color, match = 'all' } = req.query;
    const filter = {};

    if (month) {
        filter.month = parseInt(month);
    }

    if (subject) {
        filter['episodes.subject_matter'] = { $regex: new RegExp(subject, 'i') };
    }

    if (color) {
        filter['episodes.colors'] = { $all: color.split(',') };
    }

    const episodes = await client.db('bob_ross_api').collection('episodes').aggregate([
        {
            $lookup: {
                from: 'subjects',
                localField: '_id',
                foreignField: 'episode_id',
                as: 'subject_matter'
            }
        },
        {
            $lookup: {
                from: 'colors',
                localField: '_id',
                foreignField: 'episode_id',
                as: 'colors'
            }
        },
        {
            $unwind: '$subject_matter'
        },
        {
            $unwind: '$colors'
        },
        {
            $match: filter
        },
        {
            $group: {
                _id: '$_id',
                title: { $first: '$title' },
                date: { $first: '$date' },
                colors: { $push: '$colors.color' },
                subject_matter: { $push: '$subject_matter.subject' }
            }
        }
    ]).toArray();

    if (match === 'any') {
        return res.json(episodes);
    } else {
        const filteredEpisodes = episodes.filter(episode => {
            const subjectMatch = subject ? episode.subject_matter.includes(subject) : true;
            const colorMatch = color ? episode.colors.every(c => color.split(',').includes(c)) : true;
            return subjectMatch && colorMatch;
        });
        return res.json(filteredEpisodes);
    }
});


app.listen(PORT, () => {
  console.log(`Server running at http://${hostname}:${PORT}/`);
});