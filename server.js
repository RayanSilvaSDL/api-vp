const express = require('express');
const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs'); // Adiciona a importação do módulo fs
const app = express();
const port = 3000;

app.use(express.json());

let dumpDataStorage = {
  nba: null,
  seaworld: null,
  disneyworld: null
};

app.get('/', (req, res) => {
  res.send('API está funcionando!');
});

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const fetchData = async (url) => {
  try {
    const response = await axios.get(url, { httpsAgent });

    const $ = cheerio.load(response.data);
    $('style').remove();

    fs.writeFileSync('./temp.txt', JSON.stringify($('script').text()));

    const content = $('body').text().trim();

    return content;
  } catch (error) {
    console.error(`Erro ao buscar dados da URL ${url}:`, error.message);
    throw new Error(`Erro ao buscar dados da URL ${url}: ${error.message}`);
  }
};

app.get('/dados', (req, res) => {
  res.json(dumpDataStorage);
});

app.get('/dados/:site', (req, res) => {
  const site = req.params.site.toLowerCase();

  if (dumpDataStorage[site]) {
    res.json({ site, data: dumpDataStorage[site] });
  } else {
    res.status(404).json({ message: `Nenhum dado encontrado para o site: ${site}` });
  }
});

app.post('/popula-dados', async (req, res) => {
  const results = [];
  const testUrls = {
    nba: "https://shopapp-montagem.azurewebsites.net/estados-unidos/orlando/nba-orlando-magic?dump=true",
    seaworld: "https://shopapp-montagem.azurewebsites.net/estados-unidos/orlando/seaworld?dump=true",
    disneyworld: "https://shopapp-montagem.azurewebsites.net/estados-unidos/orlando/disney-world?dump=true"
  };

  for (const [site, url] of Object.entries(testUrls)) {
    try {
      const data = await fetchData(url);
      dumpDataStorage[site] = data;
      results.push({ site, url, status: 'success', message: 'Dados coletados e armazenados com sucesso.' });
    } catch (error) {
      results.push({ site, url, status: 'error', message: error.message });
    }
  }

  res.status(201).json({ results });
});

app.delete('/dados', (req, res) => {
  dumpDataStorage = {
    nba: null,
    seaworld: null,
    disneyworld: null
  }; 
  res.json({ message: 'Todos os dados foram limpos com sucesso.' });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
