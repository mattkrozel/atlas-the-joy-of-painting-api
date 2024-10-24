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
    }
});

async function   
 getEpisodeData() {
  try {
    await client.connect();

    const episodesData = await client.db('bob_ross_api').collection('episodes').find({}).project({ _id: 1, title: 1, date: 1 }).toArray();
    const colorsData = await client.db('bob_ross_api').collection('colors').find({}).toArray();
    const subjectsData = await client.db('bob_ross_api').collection('subjects').find({}).toArray();

    return { episodes: episodesData, colors: colorsData, subjects: subjectsData };
  } catch (error) {
    console.error('Error fetching episode data:', error);
    throw error;
    return null;
  } finally {
    await client.close();
  }
}

async function processEpisodes(data) {

  
  const processedEpisodes = [];
  const episodeMap = new Map();

  
  for (const episode of data.episodes) {
    episodeMap.set(episode.title.toLowerCase(), episode);
  }

  for (const color of data.colors) {
    const episodeTitle = color.painting_index.toLowerCase();
    const episode = episodeMap.get(episodeTitle);
    if (episode) {
      episode.colors = episode.colors || [];
      episode.colors.push(color.colors);
      episode.hexCodes = episode.hexCodes || [];
      episode.hexCodes.push(color.hex_code);
    }
  }

  for (const subject of data.subjects) {
    const episodeTitle = subject.EPISODE.toLowerCase();
    const episode = episodeMap.get(episodeTitle);
    if (episode) {
      episode.subject_matter = episode.subject_matter || [];
      episode.subject_matter.push(subject.SUBJECT);
    }
  }

  processedEpisodes.push(...episodeMap.values());
  return processedEpisodes;
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
    if (!episodeData) { // Check if data retrieval failed in getEpisodeData
      return res.status(500).send('Error retrieving episode data');
    }
  
    const processedEpisodes = await processEpisodes(episodeData);

    const { month, subject, color, match = 'all' } = req.query;
    const filter = {};

    if (month) {
      filter.month = parseInt(month);
    }

    if (subject) {
      filter.subject_matter = { $regex: new RegExp(subject, 'i') };
    }

    if (color) {
      filter.colors = { $all: color.split(',') }; 
    }

    const filteredEpisodes = processedEpisodes.filter(episode => {
      const subjectMatch = subject ? episode.subject_matter.some(s => s.includes(subject)) : true; 
      const colorMatch = color ? episode.colors.every(c => color.split(',').includes(c)) : true;
      const monthMatch = filter.month ? (new Date(episode.date).getMonth() + 1 === parseInt(month)) : true;

      return match === 'all' ? subjectMatch && colorMatch && monthMatch : subjectMatch || colorMatch || monthMatch; 
  });

  return res.json(filteredEpisodes);
} catch (error) {
  console.error('Error retrieving episodes:', error);
  return res.status(500).send('Error retrieving episodes');
}
});


app.listen(PORT, () => {
console.log(`Server running at http://${hostname}:${PORT}/`);
});