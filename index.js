import express from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';

const app = express();
const PORT = 3000;
const hostname = 'localhost';

const uri = "mongodb+srv://guest:guest@cluster0.wji5iwx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
        useNewUrlParser: true,
    }
});

async function getEpisodeData() {
  try {
    await client.connect();


    const episodeTitles = await client.db('bob_ross_api').collection('episodes').find({}, { projection: { Title: 1 } }).toArray().map(e => e.title.toLowerCase());


    const episodeData = new Map();


    for (const title of episodeTitles) {
      episodeData.set(title, {
        colors: [],
        subject_matter: []
      });

      const episodeColors = await client.db('bob_ross_api').collection('colors').find({ painting_title: title }).toArray();
      const episodeSubjects = await client.db('bob_ross_api').collection('subjects').find({ TITLE: title }).toArray();

      episodeData.get(title).colors.push(...episodeColors.map(c => c.colors));
      episodeData.get(title).subject_matter.push(...episodeSubjects.map(s => s.SUBJECT));
    }

    return episodeData;
  } catch (error) {
    console.error('Error fetching episode data:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function processEpisodes(episodeData, query) {
  const filteredEpisodes = [];

  for (const [title, episode] of episodeData.entries()) {
    const subjectMatch = query.subject ? episode.subject_matter.some(s => s.toLowerCase().includes(query.subject.toLowerCase())) : true;
    const colorMatch = query.color ? query.color.split(',').every(color => episode.colors.some(c => c.includes(color))) : true;
    const monthMatch = query.month ? (new Date(episode.date).getMonth() + 1 === parseInt(query.month)) : true;

    if (match === 'all' ? subjectMatch && colorMatch && monthMatch : subjectMatch || colorMatch || monthMatch) {
      filteredEpisodes.push({ title, ...episode });
    }
  }

  return filteredEpisodes;
}

async function run() {
  try {
    await client.connect();
    await client.db('bob_ross_api').command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    await client.close();
  }
}

run().catch(console.dir);

app.get('/episodes', async (req, res) => {
  try {
    await client.connect();
    const episodeData = await getEpisodeData();
    if (!episodeData) {
      return res.status(500).send('Error retrieving episode data');
    }

    const processedEpisodes = await processEpisodes(episodeData, req.query);

    return res.json(processedEpisodes);
  } catch (error) {
    console.error('Error retrieving episodes:', error);
    return res.status(500).send('Error retrieving episodes');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://${hostname}:${PORT}/`);
});