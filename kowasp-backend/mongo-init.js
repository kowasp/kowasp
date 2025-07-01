db = db.getSiblingDB('kowasp');
db.createUser({
  user: 'kowasp',
  pwd: 'kowasp123',
  roles: [ { role: 'readWrite', db: 'kowasp' } ]
}); 