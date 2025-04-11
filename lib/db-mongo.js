/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

function DB(credentials) {
  const DB_NAME = credentials.DB_NAME || 'default_db';
  const COLLECTION_NAME = credentials.COLLECTION_NAME || 'default_collection';
  const self = this;
  let db;

  self.type = function() {
    return 'Databases for MongoDB';
  };

  self.init = () => {
    return new Promise((resolve, reject) => {
      let connectionString = credentials.MONGO_URL;

      if (
        !connectionString &&
        credentials.MONGO_USERNAME &&
        credentials.MONGO_PASSWORD &&
        credentials.MONGO_HOSTS
      ) {
        connectionString = `mongodb://${credentials.MONGO_USERNAME}:${credentials.MONGO_PASSWORD}@${credentials.MONGO_HOSTS}`;
      }

      if (!connectionString) {
        return reject(new Error("No valid MongoDB connection information was found."));
      }

      var options = {
        ssl: true,
        sslValidate: true,
        poolSize: 1,
        useNewUrlParser: true,
        useUnifiedTopology: true
      };

      MongoClient.connect(connectionString, options, (err, mongoDb) => {
        if (err) {
          reject(err);
          console.log(err);
        } else {
          db = mongoDb.db(DB_NAME).collection(COLLECTION_NAME);
          resolve();
        }
      });
    });
  };

  self.count = () => {
    console.log('count');
    return new Promise((resolve, reject) => {
      db.count((err, count) => {
        if (err) {
          reject(err);
        } else {
          console.log('counted', count);
          resolve(count);
        }
      });
    });
  };

  self.search = () => {
    console.log('search');
    return new Promise((resolve, reject) => {
      db.find().toArray((err, result) => {
        if (err) {
          reject(err);
        } else {
          console.log('searched', result);
          resolve(result.map(todo => {
            todo.id = todo._id;
            delete todo._id;
            return todo;
          }));
        }
      });
    });
  };

  self.create = (item) => {
    console.log('create', item);
    return new Promise((resolve, reject) => {
      db.insertOne(item, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const newItem = {
            id: result.ops[0]._id,
            title: item.title,
            completed: item.completed,
            order: item.order
          };
          console.log('created', newItem);
          resolve(newItem);
        }
      });
    });
  };

  self.read = (id) => {
    console.log('read', id);
    return new Promise((resolve, reject) => {
      db.findOne({ _id: new mongodb.ObjectID(id) }, (err, item) => {
        if (err) {
          reject(err);
        } else {
          item.id = item._id;
          delete item._id;
          console.log('read', item);
          resolve(item);
        }
      });
    });
  };

  self.update = (id, newValue) => {
    console.log('update', id, newValue);
    return new Promise((resolve, reject) => {
      delete newValue.id;
      db.findAndModify({ _id: new mongodb.ObjectID(id) }, [], newValue, { upsert: true }, (err, updatedItem) => {
        if (err) {
          reject(err);
        } else {
          newValue.id = id;
          delete newValue._id;
          console.log('updated', newValue);
          resolve(newValue);
        }
      });
    });
  };

  self.delete = (id) => {
    console.log('delete', id);
    return new Promise((resolve, reject) => {
      db.deleteOne({ _id: new mongodb.ObjectID(id) }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          console.log('deleted', id);
          resolve({ id: id });
        }
      });
    });
  };
}

module.exports = function(credentials) {
  return new DB(credentials);
}