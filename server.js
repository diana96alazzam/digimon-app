'use strict'

require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const methodoverride = require('method-override');
const pg = require('pg');


const PORT = process.env.PORT || 4000;

const app = express();
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', errorHandler);

app.use(cors());
app.use(methodoverride('_method'));
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');


app.get('/', viewDigimons);
app.post('/add', addDigimon);
app.get('/digimons', viewFavs)
app.get('/digimons/:char_id', viewOneDigimon);
app.put('/update/:char_id', updateDigimon);
app.delete('/delete/:char_id', deleteDigimon);

function viewDigimons(request, response) {
    const apiUrl = 'https://digimon-api.herokuapp.com/api/digimon';
    superagent.get(apiUrl).then((apiRes) => {
        let digimonList = apiRes.body.map(character => {
            return new Dig(character);
        })
        response.render('index', { list: digimonList });
    })
}

function addDigimon(request, response) {
    const sqlSearch = "SELECT * FROM digimons WHERE name=$1 AND image=$2 AND level=$3;"
    const addVal = [request.body.name, request.body.img, request.body.level];
    const sqlAdd = "INSERT INTO digimons (name, image, level) VALUES ($1, $2, $3);"

    client.query(sqlSearch, addVal).then((searchRes) => {
        if (searchRes.rows.length === 0) {
            client.query(sqlAdd, addVal).then(addRes => {
                response.redirect('/digimons');
            });
        } else {
            response.redirect('/digimons');
        }
    })
}

function viewFavs(request, response) {
    const sqlSearch = "SELECT * FROM digimons;"
    client.query(sqlSearch).then(searchRes => {
        response.render('favorite', { list: searchRes.rows });
    })
}


function viewOneDigimon(request, response) {
    console.log(request.params.char_id);
    const sqlSearch = "SELECT * FROM digimons WHERE id=$1;"
    const searchVal = [request.params.char_id];
    client.query(sqlSearch, searchVal).then((searchRes) => {
        response.render('detail', { char: searchRes.rows[0] })
    })

}

function updateDigimon (request, response) {
    const sqlUpdate = "UPDATE digimons SET name=$1, level=$2 WHERE id=$3;";
    const updateVal = [request.body.name, request.body.level ,request.params.char_id];
    client.query(sqlUpdate, updateVal).then(updateRes=> {
        response.redirect(`/digimons/${request.params.char_id}`);
    })
}

function deleteDigimon (request, response){
    const sqlDelete = "DELETE FROM digimons WHERE id=$1;";
    const deleteVal = [request.params.char_id];
    client.query(sqlDelete, deleteVal).then(deleteRes=> {
        response.redirect('/digimons');
    });
}




function Dig(character) {
    this.name = character.name;
    this.img = character.img;
    this.level = character.level;
}








app.use('*', notFoundHandler);





client.connect().then(() => {
    app.listen(PORT, () => console.log(`up and running on port ${PORT}`));
})



function errorHandler(error, request, response) {
    response.status(500).send(error);
}
function notFoundHandler(request, response) {
    response.status(404).send('Page not found');
}
