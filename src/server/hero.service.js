const Hero = require('./hero.model');
const ReadPreference = require('mongodb').ReadPreference;
const identicon = require('identicon');
const fs = require('fs');
const sanitize = require("sanitize-filename");
const publicweb = './dist/publicweb';
require('./mongo').connect();
const crypto = require('crypto');

function getHeroes(req, res) {
  const docquery = Hero.find({}).read(ReadPreference.NEAREST);
  docquery
    .exec()
    .then(heroes => {
      res.status(200).json(heroes);
    })
    .catch(error => {
      res.status(500).send(error);
    });
}

function postHero(req, res) {
  const originalHero = { id: req.body.id, name: req.body.name, saying: req.body.saying };
  const hero = new Hero(originalHero);
  hero.save(error => {
    if (checkServerError(res, error)) return;
    res.status(201).json(hero);
    console.log('Hero created successfully!');
  });
}

function putHero(req, res) {
  const originalHero = {
    id: parseInt(req.params.id, 10),
    name: req.body.name,
    saying: req.body.saying
  };
  Hero.findOne({ id: originalHero.id }, (error, hero) => {
    if (checkServerError(res, error)) return;
    if (!checkFound(res, hero)) return;

    hero.name = originalHero.name;
    hero.saying = originalHero.saying;
    hero.save(error => {
      if (checkServerError(res, error)) return;
      res.status(200).json(hero);
      console.log('Hero updated successfully!');
    });
  });
}

function deleteHero(req, res) {
  const id = parseInt(req.params.id, 10);
  Hero.findOneAndRemove({ id: id })
    .then(hero => {
      if (!checkFound(res, hero)) return;
      res.status(200).json(hero);
      console.log('Hero deleted successfully!');
    })
    .catch(error => {
      if (checkServerError(res, error)) return;
    });
}

function checkServerError(res, error) {
  if (error) {
    res.status(500).send(error);
    return error;
  }
}

function checkFound(res, hero) {
  if (!hero) {
    res.status(404).send('Hero not found.');
    return;
  }
  return hero;
}

function getAvatar(req, res){
  const avatardir = publicweb + '/avatar/';
  if (!fs.existsSync(avatardir)) {
    fs.mkdirSync(avatardir);
  }

  const name = req.params.name;

  console.log(name);
  const filename = '/avatar/' + sanitize(name) + '.png';

  if (!fs.existsSync(publicweb + filename)) {
    // Asynchronous API
    identicon.generate({id: crypto.createHash('SHA512').update(filename).digest(), size: 50}, function (err, buffer) {
      if (err) checkServerError(err, res);

        // buffer is identicon in PNG format.
      fs.writeFileSync(publicweb + filename, buffer);
      res.status(200).json(filename);
    });
  } else {
    res.status(200).json(filename);
  }
}

module.exports = {
  getHeroes,
  postHero,
  putHero,
  deleteHero,
  getAvatar,
  publicweb
};
